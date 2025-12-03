

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QuotationData, Settings } from '../types';
import { ViewIcon, DeleteIcon, DuplicateIcon, PdfIcon, ArrowUpIcon, ArrowDownIcon, FileTextIcon, InvoiceIcon, ChevronDownIcon } from './icons';
import { exportToPdf } from '../services/exportService';
import { calculateTotals } from '../services/calculationService';

interface HistoryProps {
  quotations: QuotationData[];
  onView: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (updatedQuotation: QuotationData) => void;
  onConvertToInvoice: (id: string) => void;
  settings: Settings;
  activeFilterIds: string[] | null;
  onFilterChange: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
};

const StatusBadge: React.FC<{ status: 'Pending' | 'Accepted' | 'Rejected' | 'Invoiced' }> = ({ status }) => {
  const styles = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200',
    Accepted: 'bg-emerald-100 text-success border-emerald-200',
    Rejected: 'bg-red-100 text-danger border-red-200',
    Invoiced: 'bg-sky-100 text-info border-sky-200',
  };
  return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status]}`}>{status}</span>;
};

const StatusControl: React.FC<{
    quotation: QuotationData;
    onUpdateStatus: (updatedQuotation: QuotationData) => void;
}> = ({ quotation, onUpdateStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (quotation.status !== 'Pending') {
        return <StatusBadge status={quotation.status} />;
    }
    
    const handleStatusChange = (newStatus: 'Accepted' | 'Rejected') => {
        onUpdateStatus({ ...quotation, status: newStatus });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-1 text-xs font-bold rounded-full border bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 flex items-center gap-1 transition-colors"
            >
                Pending
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-32 bg-white rounded-md shadow-lg border border-border-color dark:border-slate-700 left-0">
                    <ul className="py-1 text-sm text-brand-dark dark:text-white">
                        <li>
                            <button onClick={() => handleStatusChange('Accepted')} className="w-full text-left px-4 py-2 hover:bg-brand-light dark:hover:bg-slate-700">Accept</button>
                        </li>
                        <li>
                            <button onClick={() => handleStatusChange('Rejected')} className="w-full text-left px-4 py-2 hover:bg-brand-light dark:hover:bg-slate-700">Reject</button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

const History: React.FC<HistoryProps> = ({ 
  quotations, onView, onDuplicate, onDelete, onUpdateStatus, onConvertToInvoice, settings, activeFilterIds, onFilterChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showBulkOnly, setShowBulkOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  const sortedAndFilteredQuotations = useMemo(() => {
    let filtered;

    if (activeFilterIds) {
      const filterSet = new Set(activeFilterIds);
      filtered = quotations.filter(q => filterSet.has(q.id));
    } else {
      filtered = [...quotations];
      if (showBulkOnly) {
          filtered = filtered.filter(q => q.isBulkGenerated);
      }
      if (statusFilter !== 'All') {
        filtered = filtered.filter(q => q.status === statusFilter);
      }
      if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(q =>
          q.clientDetails.clientName.toLowerCase().includes(lowercasedTerm) ||
          q.clientDetails.projectName.toLowerCase().includes(lowercasedTerm)
        );
      }
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'clientName':
          aValue = a.clientDetails.clientName;
          bValue = b.clientDetails.clientName;
          break;
        case 'total':
          aValue = calculateTotals(a, settings).grandTotal;
          bValue = calculateTotals(b, settings).grandTotal;
          break;
        default: // date
          aValue = a.date;
          bValue = b.date;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [quotations, searchTerm, statusFilter, sortConfig, settings, showBulkOnly, activeFilterIds]);

  const requestSort = (key: string) => {
    onFilterChange();
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader: React.FC<{ sortKey: string, label: string }> = ({ sortKey, label }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <th className="p-4 font-semibold text-left cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center gap-2">
                {label}
                {isSorted && (sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4"/> : <ArrowDownIcon className="w-4 h-4"/>)}
            </div>
        </th>
    )
  }
  
  return (
    <div className="bg-brand-light dark:bg-slate-900/50 p-8 rounded-2xl border border-gold-light dark:border-slate-700 shadow-lg space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-dark dark:text-white">Quotation History</h1>
        <p className="text-gray-500">Manage and track all your saved quotations.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 justify-between">
        <input
          type="text"
          placeholder="Search by client or project..."
          value={searchTerm}
          onChange={e => { onFilterChange(); setSearchTerm(e.target.value); }}
          className="w-full md:w-1/3 px-4 py-2 bg-white dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'Pending', 'Accepted', 'Rejected', 'Invoiced'].map(status => (
            <button
              key={status}
              onClick={() => { onFilterChange(); setStatusFilter(status); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${statusFilter === status && !activeFilterIds ? 'bg-gold text-brand-dark shadow' : 'bg-gray-200 dark:bg-slate-700 text-brand-dark dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'}`}
            >
              {status}
            </button>
          ))}
          <div className="flex items-center pl-2">
            <input type="checkbox" id="bulk-toggle" checked={showBulkOnly} onChange={() => { onFilterChange(); setShowBulkOnly(!showBulkOnly); }} className="h-4 w-4 rounded border-border-color text-gold focus:ring-gold" />
            <label htmlFor="bulk-toggle" className="ml-2 text-sm font-medium text-brand-dark dark:text-slate-200">Show Bulk Only</label>
          </div>
        </div>
      </div>
      
      {/* Table for Desktop */}
      <div className="hidden md:block overflow-x-auto border border-border-color dark:border-slate-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-brand-dark text-white text-xs uppercase">
            <tr>
              <SortableHeader sortKey="clientName" label="Client / Project" />
              <SortableHeader sortKey="date" label="Date" />
              <th className="p-4 font-semibold">Status</th>
              <SortableHeader sortKey="total" label="Total" />
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color dark:divide-slate-700">
            {sortedAndFilteredQuotations.map(q => (
              <tr key={q.id} className={`bg-white dark:bg-slate-800 hover:bg-gold-lightest dark:hover:bg-slate-700 transition-colors ${activeFilterIds?.includes(q.id) ? 'bg-gold-light' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-dark dark:text-white">{q.clientDetails.clientName}</span>
                    {q.isBulkGenerated && <span className="px-2 py-0.5 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full">Bulk</span>}
                  </div>
                  <div className="text-xs text-gray-500">{q.clientDetails.projectName}</div>
                </td>
                <td className="p-4">{new Date(q.date).toLocaleDateString()}</td>
                <td className="p-4"><StatusControl quotation={q} onUpdateStatus={onUpdateStatus} /></td>
                <td className="p-4 font-semibold">{formatCurrency(calculateTotals(q, settings).grandTotal)}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                      <div className="w-9 h-9 flex items-center justify-center">
                          {q.status === 'Accepted' && !q.invoiceId && (
                              <button onClick={() => onConvertToInvoice(q.id)} className="p-2 text-gray-500 hover:text-success hover:bg-green-100 rounded-full transition-colors" title="Convert to Invoice"><InvoiceIcon className="w-5 h-5"/></button>
                          )}
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                          <button onClick={() => onView(q.id)} className="p-2 text-gray-500 hover:text-gold-dark hover:bg-gold-light rounded-full transition-colors" title="View/Edit"><ViewIcon className="w-5 h-5"/></button>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                          <button onClick={() => onDuplicate(q.id)} className="p-2 text-gray-500 hover:text-indigo-500 hover:bg-indigo-100 rounded-full transition-colors" title="Duplicate"><DuplicateIcon className="w-5 h-5"/></button>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                          <button onClick={() => exportToPdf(q, settings)} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-100 rounded-full transition-colors" title="Download PDF"><PdfIcon className="w-5 h-5"/></button>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center">
                          <button onClick={() => onDelete(q.id)} className="p-2 text-gray-500 hover:text-danger hover:bg-red-100 rounded-full transition-colors" title="Delete"><DeleteIcon className="w-5 h-5"/></button>
                      </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for Mobile */}
      <div className="md:hidden space-y-6">
        {sortedAndFilteredQuotations.map(q => (
          <div key={q.id} className={`bg-white p-6 rounded-2xl border border-border-color shadow-lg ${activeFilterIds?.includes(q.id) ? 'ring-2 ring-gold' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-brand-dark flex items-center gap-2">
                  {q.clientDetails.clientName}
                  {q.isBulkGenerated && <span className="px-2 py-0.5 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full">Bulk</span>}
                </div>
                <div className="text-xs text-gray-500">{q.clientDetails.projectName}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(q.date).toLocaleDateString()}</div>
              </div>
              <StatusControl quotation={q} onUpdateStatus={onUpdateStatus} />
            </div>
            <div className="mt-4 pt-4 border-t border-border-color flex justify-between items-center">
              <div className="text-lg font-bold text-gold-dark">{formatCurrency(calculateTotals(q, settings).grandTotal)}</div>
              <div className="flex items-center gap-1">
                {q.status === 'Accepted' && !q.invoiceId && (
                    <button onClick={() => onConvertToInvoice(q.id)} className="p-2 text-gray-500 hover:text-success hover:bg-green-100 rounded-full" title="Convert to Invoice"><InvoiceIcon className="w-5 h-5"/></button>
                )}
                <button onClick={() => onView(q.id)} className="p-2 text-gray-500 hover:text-gold-dark hover:bg-gold-light rounded-full"><ViewIcon className="w-5 h-5"/></button>
                <button onClick={() => onDuplicate(q.id)} className="p-2 text-gray-500 hover:text-indigo-500 hover:bg-indigo-100 rounded-full"><DuplicateIcon className="w-5 h-5"/></button>
                <button onClick={() => exportToPdf(q, settings)} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-100 rounded-full" title="Download PDF"><PdfIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(q.id)} className="p-2 text-gray-500 hover:text-danger hover:bg-red-100 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

       {sortedAndFilteredQuotations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                <FileTextIcon className="w-16 h-16 mx-auto text-gray-300" />
                <h3 className="mt-2 text-lg font-semibold text-brand-dark">No Quotations Found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        )}
    </div>
  );
};

export default History;