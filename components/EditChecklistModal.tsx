

import React, { useState, useEffect } from 'react';
import { ChecklistItem } from '../types';
import { PlusIcon, RemoveIcon } from './icons';

interface EditChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (checklist: ChecklistItem[]) => void;
  currentChecklist: ChecklistItem[];
}

const EditChecklistModal: React.FC<EditChecklistModalProps> = ({ isOpen, onClose, onSave, currentChecklist }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    // Deep copy to prevent modifying original state directly
    setChecklist(JSON.parse(JSON.stringify(currentChecklist)));
  }, [currentChecklist, isOpen]);

  const handleItemChange = (index: number, value: string) => {
    const newChecklist = [...checklist];
    newChecklist[index].item = value;
    setChecklist(newChecklist);
  };

  const handleAddItem = () => {
    setChecklist([
      ...checklist,
      {
        item: '',
        checked: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSaveChanges = () => {
    // Filter out any empty items before saving
    const validatedChecklist = checklist.filter(item => item.item.trim() !== '');
    onSave(validatedChecklist);
  };

  if (!isOpen) return null;
  
  const inputClass = "block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm sm:text-sm focus:ring-gold/80 focus:border-gold transition disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-gray-500";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-border-color dark:border-slate-700">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">Edit Project Checklist</h2>
          <p className="text-sm text-gray-500">Add, remove, or rephrase tasks for this project.</p>
        </div>
        <div className="p-8 overflow-y-auto space-y-3">
          {checklist.map((checklistItem, index) => {
            const isCheckmate = checklistItem.item === 'Checkmate';
            return (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={checklistItem.item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  className={inputClass}
                  placeholder={`Task #${index + 1}`}
                  disabled={isCheckmate}
                />
                 <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-gray-400 hover:text-danger hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors flex-shrink-0 disabled:text-gray-300 disabled:hover:bg-transparent"
                    aria-label="Remove task"
                    disabled={isCheckmate}
                  >
                    <RemoveIcon className="w-5 h-5" />
                  </button>
              </div>
            );
          })}
           <button
            onClick={handleAddItem}
            className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 border-2 border-dashed border-border-color dark:border-slate-600 text-brand-dark dark:text-white font-semibold rounded-lg hover:border-gold hover:text-gold transition-colors"
           >
                <PlusIcon className="w-5 h-5" />
                Add New Task
            </button>
        </div>
        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t border-border-color dark:border-slate-700 flex justify-end gap-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark transition-all shadow-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditChecklistModal;
