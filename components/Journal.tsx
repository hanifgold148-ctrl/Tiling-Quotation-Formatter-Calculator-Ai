import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { PlusIcon, NotebookIcon, EditIcon, DeleteIcon } from './icons';

interface JournalProps {
  entries: JournalEntry[];
  onAdd: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const Journal: React.FC<JournalProps> = ({ entries, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    const lowercasedTerm = searchTerm.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(lowercasedTerm) ||
      entry.content.toLowerCase().includes(lowercasedTerm)
    );
  }, [entries, searchTerm]);

  return (
    <div className="bg-brand-light dark:bg-slate-900/50 p-8 rounded-2xl border border-gold-light dark:border-slate-700 shadow-lg space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark dark:text-white">Site Diary</h1>
          <p className="text-gray-500">Keep track of daily progress and notes.</p>
        </div>
        <button
          onClick={onAdd}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark transition-all shadow-md transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5"/>
          New Entry
        </button>
      </div>

      <input
        type="text"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/80 flex-shrink-0"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-slate-800 border border-gold-light dark:border-slate-700 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-bold text-gold-dark uppercase tracking-wider">{new Date(entry.date).toLocaleDateString()}</span>
                    <h3 className="font-bold text-lg text-brand-dark dark:text-white mt-1 group-hover:text-gold transition-colors">{entry.title}</h3>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => onEdit(entry)} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={() => onDelete(entry.id)} className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"><DeleteIcon className="w-4 h-4"/></button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-6 flex-grow">{entry.content}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500 flex flex-col items-center justify-center h-64">
            <NotebookIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-brand-dark dark:text-white">No Entries Yet</h3>
            <p>Start logging your site activities today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;