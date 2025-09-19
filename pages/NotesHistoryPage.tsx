/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Spinner from '../components/Spinner';

interface NoteRecord {
    id: number;
    created_at: string;
    summary: string;
}

interface NotesHistoryPageProps {
    onViewNote: (noteId: number) => void;
    onNewMeeting: () => void;
}

const NotesHistoryPage: React.FC<NotesHistoryPageProps> = ({ onViewNote, onNewMeeting }) => {
    const [notes, setNotes] = useState<NoteRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("You must be logged in to view your notes.");
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('notes')
                    .select('id, created_at, summary')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setNotes(data || []);
            } catch (err: any) {
                setError(err.message || "Failed to fetch notes.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    if (loading) {
        return (
            <div className="text-center">
                <Spinner />
                <p className="mt-2 text-slate-600">Loading your notes...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-600">{error}</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Meeting History</h1>
                 <button
                    onClick={onNewMeeting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
                >
                    + New Meeting
                </button>
            </div>
            
            {notes.length === 0 ? (
                <div className="text-center bg-white p-12 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-slate-600">You haven't saved any notes yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notes.map(note => (
                        <div 
                            key={note.id} 
                            onClick={() => onViewNote(note.id)}
                            className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                        >
                            <p className="text-sm font-semibold text-blue-600 mb-2">
                                {new Date(note.created_at).toLocaleString()}
                            </p>
                            <p className="text-slate-600 truncate">
                                {note.summary}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotesHistoryPage;
