import React, { useState, useEffect } from 'react';
import { Expense, QuotationData, Settings } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expenseToEdit: Expense | null;
  quotations: QuotationData[];
  settings: Settings;
}

const defaultExpenseState: Omit<Expense, 'id'> = {
  date: Date.now(),
  category: '',
  description: '',
  amount: 0,
  quotationId: undefined,
};

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave, expenseToEdit, quotations, settings }) => {
  const [expense, setExpense] = useState<Omit<Expense, 'id'> & { id?: string }>(defaultExpenseState);

  useEffect(() => {
    if (expenseToEdit) {
      setExpense(expenseToEdit);
    } else {
      setExpense({ ...defaultExpenseState, category: settings.defaultExpenseCategories[0] || ''});
    }
  }, [expenseToEdit, isOpen, settings.defaultExpenseCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'date') {
        const date = new Date(value);
        setExpense(prev => ({ ...prev, [name]: date.getTime() }));
    } else if (type === 'number') {
        setExpense(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
        setExpense(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSave = () => {
    if (expense.description.trim() && expense.amount > 0 && expense.category) {
      onSave(expense as Expense);
    }
  };

  if (!isOpen) return null;

  const isFormValid = expense.description.trim() !== '' && expense.amount > 0 && expense.category.trim() !== '';
  const formatDateForInput = (timestamp: number) => new Date(timestamp).toISOString().split('T')[0];
  const inputClass = "mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition";


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-8 border-b border-border-color dark:border-slate-700">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</h2>
          <p className="text-sm text-gray-500">Log a cost for your business.</p>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Description*</label>
            <input
              type="text" id="description" name="description" value={expense.description} onChange={handleChange}
              placeholder="e.g., Purchase of Ardex Grout"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Amount (NGN)*</label>
              <input
                type="number" id="amount" name="amount" value={expense.amount} onChange={handleChange}
                placeholder="e.g., 25000"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Date*</label>
              <input
                type="date" id="date" name="date" value={formatDateForInput(expense.date)} onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Category*</label>
            <select
              id="category" name="category" value={expense.category} onChange={handleChange}
              className={inputClass}
            >
              {settings.defaultExpenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="quotationId" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Link to Project (Optional)</label>
            <select
              id="quotationId" name="quotationId" value={expense.quotationId || ''} onChange={handleChange}
              className={inputClass}
            >
              <option value="">None</option>
              {quotations.map(q => (
                <option key={q.id} value={q.id}>
                  {q.clientDetails.clientName} - {q.clientDetails.projectName || new Date(q.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t border-border-color dark:border-slate-700 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600">Cancel</button>
          <button type="button" onClick={handleSave} disabled={!isFormValid} className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark disabled:bg-gray-400 disabled:cursor-not-allowed">Save Expense</button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
