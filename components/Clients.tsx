import React, { useState, useMemo } from 'react';
import { Client, QuotationData } from '../types';
import { EditIcon, DeleteIcon, ViewIcon, PlusIcon, FileTextIcon, ClientsIcon } from './icons';

interface ClientsProps {
  clients: Client[];
  quotations: QuotationData[];
  onAdd: () => void;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onViewQuotes: (id: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, quotations, onAdd, onEdit, onDelete, onViewQuotes }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowercasedTerm = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowercasedTerm) ||
      client.address.toLowerCase().includes(lowercasedTerm) ||
      client.phone.toLowerCase().includes(lowercasedTerm)
    );
  }, [clients, searchTerm]);
  
  const quoteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const quote of quotations) {
        if(quote.clientDetails.clientId) {
            counts[quote.clientDetails.clientId] = (counts[quote.clientDetails.clientId] || 0) + 1;
        }
    }
    return counts;
  }, [quotations]);

  return (
    <div className="bg-brand-light dark:bg-slate-900/50 p-8 rounded-2xl border border-gold-light dark:border-slate-700 shadow-lg space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark dark:text-white">Client Management</h1>
          <p className="text-gray-500">View, add, and edit your client records.</p>
        </div>
        <button
          onClick={onAdd}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark transition-all shadow-md transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5"/>
          Add New Client
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, address, or phone..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.length > 0 ? (
          filteredClients.map(client => (
            <div key={client.id} className="bg-white dark:bg-slate-800 border border-gold-light dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div>
                <h3 className="font-bold text-lg text-brand-dark dark:text-white">{client.name}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">{client.address}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">{client.phone}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border-color dark:border-slate-700 flex justify-between items-center">
                <div className="text-sm font-medium text-brand-dark dark:text-slate-300">
                  {quoteCounts[client.id] || 0} Quotation{quoteCounts[client.id] !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onViewQuotes(client.id)} className="p-2 text-gray-500 hover:text-gold-dark hover:bg-gold-light rounded-full transition-colors" title="View Quotations"><ViewIcon className="w-5 h-5"/></button>
                  <button onClick={() => onEdit(client)} className="p-2 text-gray-500 hover:text-indigo-500 hover:bg-indigo-100 rounded-full transition-colors" title="Edit Client"><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => onDelete(client.id)} className="p-2 text-gray-500 hover:text-danger hover:bg-red-100 rounded-full transition-colors" title="Delete Client"><DeleteIcon className="w-5 h-5"/></button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
            <ClientsIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-2 text-lg font-semibold text-brand-dark dark:text-white">No Clients Found</h3>
            <p>Click "Add New Client" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;