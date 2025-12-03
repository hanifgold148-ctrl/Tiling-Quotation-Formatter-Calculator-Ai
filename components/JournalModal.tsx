import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { RemoveIcon } from './icons';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  entryToEdit: JournalEntry | null;
}

const defaultEntryState: Omit<JournalEntry, 'id'> = {
  title: '',
  content: '',
  date: Date.now(),
};

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, onSave, entryToEdit }) => {
  const [entry, setEntry] = useState<Omit<JournalEntry, 'id'> & { id?: string }>(defaultEntryState);

  useEffect(() => {
    if (entryToEdit) {
      setEntry(entryToEdit);
    } else {
      setEntry({ ...defaultEntryState, date: Date.now() });
    }
  }, [entryToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'date') {
        const date = new Date(value);
        setEntry(prev => ({ ...prev, [name]: date.getTime() }));
    } else {
        setEntry(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSave = () => {
    if (entry.title.trim() && entry.content.trim()) {
      onSave(entry as JournalEntry);
    }
  };

  if (!isOpen) return null;

  const formatDateForInput = (timestamp: number) => new Date(timestamp).toISOString().split('T')[0];
  const inputClass = "mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-brand-dark dark:text-white">{entryToEdit ? 'Edit Entry' : 'New Diary Entry'}</h2>
            <p className="text-sm text-gray-500">Record site progress or daily notes.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-danger hover:bg-red-100 rounded-full">
            <RemoveIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-6 flex-grow overflow-y-auto">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Title*</label>
            <input
              type="text" id="title" name="title" value={entry.title} onChange={handleChange}
              placeholder="e.g., Site Visit - Lekki Phase 1"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Date*</label>
            <input
              type="date" id="date" name="date" value={formatDateForInput(entry.date)} onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="flex-grow">
            <label htmlFor="content" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Content*</label>
            <textarea
              id="content" name="content" value={entry.content} onChange={handleChange}
              rows={8}
              placeholder="Write your notes here..."
              className={inputClass}
            />
          </div>
        </div>
        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t border-border-color dark:border-slate-700 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600">Cancel</button>
          <button type="button" onClick={handleSave} disabled={!entry.title.trim() || !entry.content.trim()} className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark disabled:bg-gray-400 disabled:cursor-not-allowed">Save Entry</button>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;