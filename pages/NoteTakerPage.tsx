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
  const accumulatedTranscriptRef = useRef<string>('');
  const isStoppingRef = useRef<boolean>(false);
  const appStateRef = useRef(appState);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);


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
    
    recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = accumulatedTranscriptRef.current;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        accumulatedTranscriptRef.current = finalTranscript;
        setTranscription(finalTranscript + interimTranscript);
    };
    
    recognition.onerror = (event: any) => {
        console.error("SpeechRecognition error:", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            const errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings to use this feature.';
            setError(errorMessage);
            setAppState('error');
        } else if (event.error !== 'network' && event.error !== 'no-speech') {
            const errorMessage = `An unexpected error occurred with speech recognition: ${event.error}.`;
            setError(errorMessage);
            setAppState('error');
        }
    };

    recognition.onend = async () => {
        if (isStoppingRef.current) {
            // This logic runs when recording is manually stopped.
            const finalTranscriptToProcess = accumulatedTranscriptRef.current;
            setFinalTranscription(finalTranscriptToProcess);
            
            // If no speech was detected, show a helpful error instead of the results page.
            if (!finalTranscriptToProcess.trim()) {
                setError("We didn't catch any audio. Please make sure your microphone is working and try recording again.");
                setAppState('error');
                return;
            }

            // If there is a transcript, proceed with summarization and saving.
            try {
                const notes = await summarizeTranscription(finalTranscriptToProcess);
                setMeetingNotes(notes);

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
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(errorMessage);
                setAppState('error');
            }
        } else if (appStateRef.current === 'recording') {
            // Service stopped unexpectedly while recording, so restart it.
            console.log("Speech recognition service ended unexpectedly, restarting...");
            try {
                recognition.start();
            } catch (e) {
                console.error("Error restarting recognition:", e);
                setError("The speech recognition service stopped and could not be restarted. Please try again.");
                setAppState('error');
            }
        }
    }
    
    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
        isStoppingRef.current = true;
        if(recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, [session.user.id]);
  
  const handleStartRecording = useCallback(() => {
    if (recognitionRef.current) {
      accumulatedTranscriptRef.current = '';
      isStoppingRef.current = false;
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
        isStoppingRef.current = true;
        recognitionRef.current.stop();
        setAppState('processing');
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState('idle');
    setTranscription('');
    setFinalTranscription('');
    setMeetingNotes(null);
    setError(null);
    isStoppingRef.current = true; // Ensure recognition doesn't restart
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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