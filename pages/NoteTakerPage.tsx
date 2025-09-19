/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { summarizeTranscription } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { MeetingNotes } from '../types';
import Spinner from '../components/Spinner';
import NotesDisplay from '../components/NotesDisplay';

// Extend the Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type AppState = 'idle' | 'recording' | 'processing' | 'results' | 'error';

interface NoteTakerPageProps {
    session: Session;
    onViewHistory: () => void;
}

const NoteTakerPage: React.FC<NoteTakerPageProps> = ({ session, onViewHistory }) => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [finalTranscription, setFinalTranscription] = useState<string>('');
  const [meetingNotes, setMeetingNotes] = useState<MeetingNotes | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition API is not supported in this browser. Please try Chrome or Edge.");
      setAppState('error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    let accumulatedFinalTranscript = '';
    recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                accumulatedFinalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setTranscription(accumulatedFinalTranscript + interimTranscript);
    };
    
    recognition.onerror = (event: any) => {
        console.error("SpeechRecognition error:", event.error);
        setError(`An error occurred during speech recognition: ${event.error}`);
        setAppState('error');
    };

    recognition.onend = () => {
        // When recognition stops, save the final accumulated transcript
        setFinalTranscription(accumulatedFinalTranscript);
    }
    
    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
        if(recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, []);
  
  const handleStartRecording = useCallback(() => {
    if (recognitionRef.current) {
      setTranscription('');
      setFinalTranscription('');
      setMeetingNotes(null);
      setError(null);
      try {
        recognitionRef.current.start();
        setAppState('recording');
      } catch (err) {
         setError("Recording could not be started. Please ensure microphone permissions are granted.");
         setAppState('error');
      }
    }
  }, []);
  
  const handleStopRecording = useCallback(async () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        setAppState('processing');
        try {
            // A short delay to allow the final transcript to process from onend event
            setTimeout(async () => {
                // Use the state that was updated by the onend event
                const finalTranscriptToProcess = finalTranscription || transcription;
                
                if (!finalTranscriptToProcess.trim()) {
                    setMeetingNotes({ summary: "No speech was detected.", actionItems: [], keyDecisions: [] });
                    setAppState('results');
                    return;
                }

                const notes = await summarizeTranscription(finalTranscriptToProcess);
                setMeetingNotes(notes);

                // Save notes to Supabase
                const { error: dbError } = await supabase
                    .from('notes')
                    .insert([
                        { 
                            user_id: session.user.id, 
                            summary: notes.summary,
                            action_items: notes.actionItems,
                            key_decisions: notes.keyDecisions,
                            transcription: finalTranscriptToProcess,
                        }
                    ]);

                if (dbError) {
                    throw new Error(`Failed to save notes: ${dbError.message}`);
                }

                setAppState('results');
            }, 500);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setAppState('error');
        }
    }
  }, [transcription, finalTranscription, session.user.id]);

  const handleReset = useCallback(() => {
    setAppState('idle');
    setTranscription('');
    setFinalTranscription('');
    setMeetingNotes(null);
    setError(null);
  }, []);

  const renderContent = () => {
    switch(appState) {
      case 'idle':
        return (
          <div className="text-center animate-fade-in">
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
              Ready to capture your meeting? Click the button below to start recording. We'll provide a live transcript and a full AI-powered summary when you're done.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleStartRecording}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Recording
                </button>
                <button
                    onClick={onViewHistory}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg border border-slate-300"
                >
                    View History
                </button>
            </div>
          </div>
        );
      case 'recording':
        return (
            <div className="w-full max-w-4xl mx-auto animate-fade-in">
                <div className="text-center mb-6">
                    <button
                      onClick={handleStopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                      Stop & Summarize
                    </button>
                    <p className="text-slate-500 mt-4 text-sm flex items-center justify-center">
                        <span className="relative flex h-3 w-3 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Recording in progress...
                    </p>
                </div>
                <textarea
                  id="transcription-area"
                  readOnly
                  value={transcription}
                  placeholder="Your live transcription will appear here..."
                  className="w-full h-64 p-4 border border-slate-300 rounded-lg bg-white shadow-inner text-slate-700"
                />
            </div>
        );
      case 'processing':
        return (
          <div className="text-center animate-fade-in">
            <Spinner />
            <p className="text-xl mt-4 text-slate-600">
              Processing and saving your notes...
            </p>
          </div>
        );
      case 'results':
        return meetingNotes && (
          <div className="w-full">
            <div className="text-center mb-10">
                <button
                    onClick={handleReset}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-md transition-colors shadow-md"
                >
                    Start New Meeting
                </button>
            </div>
            <NotesDisplay 
                notes={meetingNotes}
                transcription={finalTranscription || transcription}
            />
          </div>
        );
      case 'error':
        return (
          <div className="text-center animate-fade-in bg-red-50 border border-red-200 p-8 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-red-800">An Error Occurred</h2>
            <p className="text-md text-red-700 mb-6">{error}</p>
            <button
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
  };

  return <>{renderContent()}</>;
};

export default NoteTakerPage;