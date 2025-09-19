/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseInitialized } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import AuthPage from './pages/AuthPage';
import NoteTakerPage from './pages/NoteTakerPage';
import NotesHistoryPage from './pages/NotesHistoryPage';
import NoteDetailPage from './pages/NoteDetailPage';
import Header from './components/Header';
import ConfigurationNeeded from './components/ConfigurationNeeded';

type AppView = 'note_taker' | 'history' | 'note_detail';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>('note_taker');
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseInitialized) {
      setLoading(false);
      return;
    }

    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Reset view when user logs out
        setView('note_taker');
        setSelectedNoteId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigateToHistory = () => {
    setView('history');
    setSelectedNoteId(null);
  };

  const handleNavigateToNoteTaker = () => {
    setView('note_taker');
    setSelectedNoteId(null);
  }

  const handleViewNoteDetail = (noteId: number) => {
    setSelectedNoteId(noteId);
    setView('note_detail');
  };

  const renderContent = () => {
    if (!isSupabaseInitialized) {
      return <ConfigurationNeeded />;
    }

    if (!session) {
      return <AuthPage />;
    }

    switch (view) {
      case 'history':
        return <NotesHistoryPage onViewNote={handleViewNoteDetail} onNewMeeting={handleNavigateToNoteTaker} />;
      case 'note_detail':
        return <NoteDetailPage noteId={selectedNoteId!} onBack={handleNavigateToHistory} />;
      case 'note_taker':
      default:
        return <NoteTakerPage session={session} onViewHistory={handleNavigateToHistory} />;
    }
  };
  
  if (loading) {
    return null; // Or a loading spinner for the whole page
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8">
      {isSupabaseInitialized && <Header session={session} />}
      <main className="w-full flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;