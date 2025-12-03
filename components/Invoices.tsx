

import React, { useState, useMemo } from 'react';
import { InvoiceData, Settings } from '../types';
import { ViewIcon, DeleteIcon, PdfIcon, ArrowUpIcon, ArrowDownIcon, FileTextIcon, CheckCircleIcon, EditIcon } from './icons';
import { exportInvoiceToPdf } from '../services/exportService';
import { calculateTotals } from '../services/calculationService';

interface InvoicesProps {
  invoices: InvoiceData[];
  settings: Settings;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedInvoice: InvoiceData) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
};

const StatusBadge: React.FC<{ status: 'Paid' | 'Unpaid' | 'Overdue' }> = ({ status }) => {
  const styles = {
    Unpaid: 'bg-amber-100 text-amber-800 border-amber-200',
    Paid: 'bg-emerald-100 text-success border-emerald-200',
    Overdue: 'bg-red-100 text-danger border-red-200',
  };
  return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status]}`}>{status}</span>;
};

const Invoices: React.FC<InvoicesProps> = ({ invoices, settings, onEdit, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'invoiceDate', direction: 'desc' });
  
  const processedInvoices = useMemo(() => {
      const now = new Date().getTime();
      return invoices.map(inv => {
          let status: 'Paid' | 'Unpaid' | 'Overdue' = inv.status;
          if (inv.status === 'Unpaid' && inv.dueDate < now) {
              status = 'Overdue';
          }
          return { ...inv, status };
      });
  }, [invoices]);

  const sortedAndFilteredInvoices = useMemo(() => {
    let filtered = [...processedInvoices];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.clientDetails.clientName.toLowerCase().includes(lowercasedTerm) ||
        inv.invoiceNumber.toLowerCase().includes(lowercasedTerm)
      );
    }

    filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        if (sortConfig.key === 'total') {
            aValue = calculateTotals(a, settings).grandTotal;
            bValue = calculateTotals(b, settings).grandTotal;
        } else {
            aValue = a[sortConfig.key as keyof InvoiceData];
            bValue = b[sortConfig.key as keyof InvoiceData];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return filtered;
  }, [processedInvoices, searchTerm, statusFilter, sortConfig, settings]);
  
  const handleMarkAsPaid = (invoice: InvoiceData) => {
      if (window.confirm(`Are you sure you want to mark invoice ${invoice.invoiceNumber} as Paid?`)) {
          onUpdate({ ...invoice, status: 'Paid', paymentDate: Date.now() });
      }
  }

  const requestSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const SortableHeader: React.FC<{ sortKey: string, label: string }> = ({ sortKey, label }) => (
    <th className="p-4 font-semibold text-left cursor-pointer" onClick={() => requestSort(sortKey)}>
        <div className="flex items-center gap-2">
            {label}
            {sortConfig.key === sortKey && (sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4"/> : <ArrowDownIcon className="w-4 h-4"/>)}
        </div>
    </th>
  );
  
  return (
    <div className="bg-brand-light dark:bg-slate-900/50 p-8 rounded-2xl border border-gold-light dark:border-slate-700 shadow-lg space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-dark dark:text-white">Invoices</h1>
        <p className="text-gray-500">Manage all your client invoices.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 justify-between">
        <input
          type="text"
          placeholder="Search by client or invoice #..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 bg-white dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold"
        />
        <div className="flex items-center gap-2">
          {['All', 'Paid', 'Unpaid', 'Overdue'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${statusFilter === status ? 'bg-gold text-brand-dark shadow' : 'bg-gray-200 dark:bg-slate-700 text-brand-dark dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto border border-border-color dark:border-slate-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-brand-dark text-white text-xs uppercase">
            <tr>
              <SortableHeader sortKey="invoiceNumber" label="Invoice #" />
              <th className="p-4 font-semibold">Client</th>
              <SortableHeader sortKey="invoiceDate" label="Issued" />
              <SortableHeader sortKey="dueDate" label="Due" />
              <SortableHeader sortKey="total" label="Total" />
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color dark:divide-slate-700">
            {sortedAndFilteredInvoices.map(inv => (
              <tr key={inv.id} className="bg-white dark:bg-slate-800 hover:bg-gold-lightest dark:hover:bg-slate-700 transition-colors">
                <td className="p-4 font-semibold text-gold-dark">{inv.invoiceNumber}</td>
                <td className="p-4 font-bold text-brand-dark dark:text-white">{inv.clientDetails.clientName}</td>
                <td className="p-4">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="p-4 font-semibold">{formatCurrency(calculateTotals(inv, settings).grandTotal)}</td>
                <td className="p-4"><StatusBadge status={inv.status} /></td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                      <div className="w-9 h-9 flex items-center justify-center">
                          {inv.status !== 'Paid' && (
                            <button onClick={() => handleMarkAsPaid(inv)} className="p-2 text-gray-500 hover:text-success hover:bg-green-100 rounded-full transition-colors" title="Mark as Paid"><CheckCircleIcon className="w-5 h-5"/></button>
                          )}
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                          <button onClick={() => onEdit(inv.id)} className="p-2 text-gray-500 hover:text-gold-dark hover:bg-gold-light rounded-full transition-colors" title="View/Edit"><EditIcon className="w-5 h-5"/></button>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                          <button onClick={async () => await exportInvoiceToPdf(inv, settings)} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-100 rounded-full transition-colors" title="Download PDF"><PdfIcon className="w-5 h-5"/></button>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                          <button onClick={() => onDelete(inv.id)} className="p-2 text-gray-500 hover:text-danger hover:bg-red-100 rounded-full transition-colors" title="Delete"><DeleteIcon className="w-5 h-5"/></button>
                      </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       {sortedAndFilteredInvoices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                <FileTextIcon className="w-16 h-16 mx-auto text-gray-300" />
                <h3 className="mt-2 text-lg font-semibold text-brand-dark dark:text-white">No Invoices Found</h3>
                <p>Try adjusting your search or filters, or convert an accepted quotation to get started.</p>
            </div>
        )}
    </div>
  );
};

export default Invoices;