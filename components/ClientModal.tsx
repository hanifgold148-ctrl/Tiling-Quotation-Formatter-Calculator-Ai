import React, { useState, useEffect } from 'react';
import { Client } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  clientToEdit: Client | null;
}

const defaultClientState = { id: '', name: '', address: '', phone: '' };

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, clientToEdit }) => {
  const [client, setClient] = useState<Client>(defaultClientState);

  useEffect(() => {
    if (clientToEdit) {
      setClient(clientToEdit);
    } else {
      setClient(defaultClientState);
    }
  }, [clientToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClient({ ...client, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (client.name.trim()) {
      onSave(client);
    }
  };
  
  if (!isOpen) return null;

  const inputClass = "mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-8 border-b border-border-color dark:border-slate-700">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">{clientToEdit ? 'Edit Client' : 'Add New Client'}</h2>
          <p className="text-sm text-gray-500">Enter the client's contact information.</p>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Client Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={client.name}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={client.address}
              onChange={handleChange}
              placeholder="e.g., 123 Banana Island, Lagos"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={client.phone}
              onChange={handleChange}
              placeholder="e.g., 08012345678"
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
            disabled={!client.name.trim()}
            className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
          >
            Save Client
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientModal;
