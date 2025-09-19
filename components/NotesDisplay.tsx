/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { MeetingNotes } from '../types';

interface NotesDisplayProps {
  notes: MeetingNotes;
  transcription: string;
}

const NotesDisplay: React.FC<NotesDisplayProps> = ({ notes, transcription }) => {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Summary Column */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">AI Summary</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-700 mb-2">Summary</h3>
                        <p className="text-slate-600 whitespace-pre-wrap">{notes.summary}</p>
                    </div>
                    {notes.actionItems.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-blue-700 mb-2">Action Items</h3>
                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                                {notes.actionItems.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                    {notes.keyDecisions.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-blue-700 mb-2">Key Decisions</h3>
                             <ul className="list-disc list-inside space-y-1 text-slate-600">
                                {notes.keyDecisions.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Transcription Column */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">Full Transcription</h2>
                 <textarea
                  readOnly
                  value={transcription}
                  className="w-full h-96 p-2 border-none rounded-md bg-slate-50 text-slate-700 focus:ring-0"
                />
            </div>
        </div>
    </div>
  );
};

export default NotesDisplay;