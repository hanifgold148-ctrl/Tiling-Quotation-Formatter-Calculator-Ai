
import React, { useState, useEffect } from 'react';
import { Adjustment } from '../types';
import { PlusIcon, RemoveIcon } from './icons';

interface AddAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adjustments: Adjustment[]) => void;
  currentAdjustments: Adjustment[];
}

const AddAdjustmentModal: React.FC<AddAdjustmentModalProps> = ({ isOpen, onClose, onSave, currentAdjustments }) => {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  useEffect(() => {
    setAdjustments(JSON.parse(JSON.stringify(currentAdjustments)));
  }, [currentAdjustments, isOpen]);

  const handleAdjustmentChange = (index: number, field: keyof Adjustment, value: string | number) => {
    const newAdjustments = [...adjustments];
    (newAdjustments[index] as any)[field] = value;
    setAdjustments(newAdjustments);
  };

  const handleAddItem = () => {
    setAdjustments([...adjustments, { description: '', amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };

  const handleSaveChanges = () => {
    const validatedAdjustments = adjustments.filter(adj => adj.description.trim() !== '');
    onSave(validatedAdjustments);
  };

  if (!isOpen) return null;
  const inputClass = "px-3 py-2 bg-white dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-border-color dark:border-slate-700">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">Discounts & Adjustments</h2>
          <p className="text-sm text-gray-500">Add discounts (negative amount) or extra charges (positive amount).</p>
        </div>
        <div className="p-8 overflow-y-auto space-y-3">
          {adjustments.map((adj, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-brand-light/60 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
              <input
                type="text"
                value={adj.description}
                onChange={(e) => handleAdjustmentChange(index, 'description', e.target.value)}
                placeholder="Description (e.g., Early Payment Discount)"
                className={`flex-grow ${inputClass}`}
              />
              <input
                type="number"
                value={adj.amount}
                onChange={(e) => handleAdjustmentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="Amount"
                className={`w-32 ${inputClass}`}
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="p-2 text-gray-400 hover:text-danger hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                aria-label="Remove adjustment"
              >
                <RemoveIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddItem}
            className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 border-2 border-dashed border-border-color dark:border-slate-600 text-brand-dark dark:text-white font-semibold rounded-lg hover:border-gold hover:text-gold"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Item
          </button>
        </div>
        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t border-border-color dark:border-slate-700 flex justify-end gap-4 mt-auto">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600">Cancel</button>
          <button type="button" onClick={handleSaveChanges} className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default AddAdjustmentModal;
