/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import Spinner from '../components/Spinner';
import NotesDisplay from '../components/NotesDisplay';
import { MeetingNotes } from '../types';
import { exportAsMarkdown, exportAsPdf } from '../services/exportService';

interface NoteRecord extends MeetingNotes {
    id: number;
    created_at: string;
    transcription: string;
    actionItems: string[];
    keyDecisions: string[];
    title: string | null;
}

interface NoteDetailPageProps {
    noteId: number;
    onBack: () => void;
}

const NoteDetailPage: React.FC<NoteDetailPageProps> = ({ noteId, onBack }) => {
    const [note, setNote] = useState<NoteRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchNote = async () => {
            if (!noteId) {
                setError("No note selected.");
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('id', noteId)
                    .single(); // Fetch a single record

                if (error) throw error;
                if (!data) throw new Error("Note not found.");
                
                // Map database columns to MeetingNotes interface
                const formattedNote = {
                    ...data,
                    actionItems: data.action_items || [],
                    keyDecisions: data.key_decisions || [],
                };

                setNote(formattedNote);
            } catch (err: any) {
                setError(err.message || "Failed to fetch note details.");
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [noteId]);

    const handleExport = (format: 'md' | 'pdf') => {
        if (!note) return;
        setIsExporting(true);
        setDropdownOpen(false);

        try {
            if (format === 'md') {
                exportAsMarkdown(note);
            } else {
                exportAsPdf(note);
            }
        } catch (exportError) {
            console.error("Export failed:", exportError);
            setError("Could not export the note.");
        } finally {
             setTimeout(() => setIsExporting(false), 1000);
        }
    };

    if (loading) {
        return (
            <div className="text-center flex flex-col items-center">
                <Spinner className="text-slate-600" />
                <p className="mt-2 text-slate-600">Loading note details...</p>
            </div>
        );
    }

    if (error && !note) { // Only show full-page error if the note fails to load
        return <div className="text-center text-red-600">{error}</div>;
    }

    return (
        <div className="w-full animate-fade-in">
            {note && (
                <>
                    <div className="w-full max-w-6xl mx-auto mb-8">
                       <div className="mb-6">
                            <h1 className="text-3xl font-extrabold text-slate-800 break-words">
                                {note.title || `Meeting Notes`}
                            </h1>
                            <p className="text-md text-slate-500 mt-1">
                                {new Date(note.created_at).toLocaleString()}
                            </p>
                        </div>
                       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button
                                onClick={onBack}
                                className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors shadow-sm border border-slate-300 w-full sm:w-auto"
                            >
                                &larr; Back to History
                            </button>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    disabled={isExporting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center disabled:bg-blue-400"
                                >
                                    {isExporting ? <Spinner /> : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    Export
                                </button>
                                {dropdownOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fade-in">
                                        <div className="py-1" role="menu" aria-orientation="vertical">
                                            <button
                                                onClick={() => handleExport('md')}
                                                className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                role="menuitem"
                                            >
                                                Download as Markdown (.md)
                                            </button>
                                            <button
                                                onClick={() => handleExport('pdf')}
                                                className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                role="menuitem"
                                            >
                                                Download as PDF (.pdf)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                       </div>
                       {error && <div className="mt-4 text-center text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                    </div>
                    <NotesDisplay 
                        notes={note}
                        transcription={note.transcription}
                    />
                </>
            )}
        </div>
    );
};

export default NoteDetailPage;