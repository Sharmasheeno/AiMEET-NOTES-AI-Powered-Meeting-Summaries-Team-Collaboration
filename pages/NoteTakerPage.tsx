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
type PermissionStatus = 'prompt' | 'granted' | 'denied';

interface NoteTakerPageProps {
    session: Session;
    onViewHistory: () => void;
}

const MicrophoneIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
        <path fillRule="evenodd" d="M3 8a1 1 0 011-1h1v2a4 4 0 004 4h.01a4 4 0 004-4V7h1a1 1 0 110 2h-1.07a5.002 5.002 0 01-8.86 0H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const MicrophoneSlashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5l14 14" />
    </svg>
);


const NoteTakerPage: React.FC<NoteTakerPageProps> = ({ session, onViewHistory }) => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [finalTranscription, setFinalTranscription] = useState<string>('');
  const [meetingNotes, setMeetingNotes] = useState<MeetingNotes | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const isStoppingRef = useRef<boolean>(false);
  const appStateRef = useRef(appState);
  const transcriptionRef = useRef('');

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  // Check microphone permission status on component mount
  useEffect(() => {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permission) => {
          setPermissionStatus(permission.state as PermissionStatus);
          permission.onchange = () => {
            setPermissionStatus(permission.state as PermissionStatus);
          };
        }).catch(() => {
            console.warn("Permissions API not fully supported. Relying on user action to trigger prompt.");
        });
      }
  }, []);

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
        const currentTranscript = finalTranscript + interimTranscript;
        // Update the ref directly to avoid race conditions with React state updates
        transcriptionRef.current = currentTranscript;
        setTranscription(currentTranscript);
    };
    
    recognition.onerror = (event: any) => {
        // These are often transient and the recognition service might recover.
        // We can log them but avoid showing a disruptive error to the user.
        if (event.error === 'network' || event.error === 'no-speech' || event.error === 'aborted') {
            console.warn(`Speech recognition notice: ${event.error}.`);
            return;
        }

        console.error("SpeechRecognition error:", event.error, event.message);

        let errorMessage = `An unexpected error occurred during transcription: ${event.error}.`;
        switch (event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
                errorMessage = 'Microphone access was denied. To enable transcription, please allow microphone access in your browser settings.';
                break;
            case 'audio-capture':
                errorMessage = 'No microphone was found. Please ensure your microphone is connected and working correctly.';
                break;
        }
        setError(errorMessage);
        setAppState('error');
    };

    recognition.onend = async () => {
        if (isStoppingRef.current) {
            const finalTranscriptToProcess = transcriptionRef.current;
            setFinalTranscription(finalTranscriptToProcess);
            
            if (!finalTranscriptToProcess.trim()) {
                setError("We didn't catch any audio. Please make sure your microphone is working and try recording again.");
                setAppState('error');
                return;
            }

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
                    throw new Error(`Your notes were summarized, but could not be saved to your history due to a network or database issue. Please try again.`);
                }

                setAppState('results');
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(errorMessage);
                setAppState('error');
            }
        } else if (appStateRef.current === 'recording') {
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
      transcriptionRef.current = '';
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
    isStoppingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const renderContent = () => {
    switch(appState) {
      case 'idle':
        if (permissionStatus === 'denied') {
            return (
                <div className="text-center animate-fade-in max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-lg">
                    <MicrophoneSlashIcon />
                    <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-2">Microphone Access Blocked</h2>
                    <p className="text-slate-600 mb-6">
                        You have blocked microphone access. To use the transcriber, please enable it in your browser's site settings and refresh the page.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            disabled
                            className="bg-slate-400 text-white font-bold py-4 px-8 rounded-full text-lg cursor-not-allowed"
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
        }
        if (permissionStatus === 'prompt') {
            return (
                <div className="text-center animate-fade-in max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-lg">
                    <MicrophoneIcon />
                    <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-2">Ready to Transcribe?</h2>
                    <p className="text-slate-600 mb-6">
                        To begin, please grant microphone access when prompted. This allows AiMEET NOTES to capture your conversation for live transcription.
                    </p>
                    <button
                        onClick={handleStartRecording}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                        Enable Microphone
                    </button>
                </div>
            );
        }
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
          <div className="text-center animate-fade-in flex flex-col items-center">
            <Spinner className="text-slate-600" />
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