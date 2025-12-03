import React, { useState } from 'react';
import { Material, Settings } from '../types';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Omit<Material, 'confidence'>) => void;
  settings: Settings;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, onSave, settings }) => {
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (item && typeof quantity === 'number' && quantity > 0 && unit && typeof unitPrice === 'number' && unitPrice >= 0) {
      onSave({
        item,
        quantity,
        unit,
        unitPrice,
      });
      // Reset form and close
      setItem('');
      setQuantity('');
      setUnit('');
      setUnitPrice('');
      onClose();
    }
  };

  const isFormValid = item.trim() !== '' && unit.trim() !== '' && Number(quantity) > 0 && Number(unitPrice) >= 0;
  const inputClass = "mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-8 border-b border-border-color dark:border-slate-700">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">Add New Material</h2>
          <p className="text-sm text-gray-500">Manually add an item to the materials list.</p>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label htmlFor="item" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Material Name</label>
            <input
              type="text"
              id="item"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g., Tile Adhesive"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Quantity</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g., 10"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Unit</label>
              <input
                type="text"
                id="unit"
                list="units-datalist"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., bags"
                className={inputClass}
              />
              <datalist id="units-datalist">
                {settings.customMaterialUnits.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label htmlFor="unitPrice" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Unit Price (NGN)</label>
            <input
              type="number"
              id="unitPrice"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="e.g., 3500"
              className={inputClass}
            />
          </div>
        </div>
        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t border-border-color dark:border-slate-700 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid}
            className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark transition-all shadow-md disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed"
          >
            Add Material
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMaterialModal;