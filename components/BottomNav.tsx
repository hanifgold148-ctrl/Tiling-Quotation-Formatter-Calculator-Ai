import React from 'react';
import { GenerateIcon, DashboardIcon, HistoryIcon, InvoiceIcon, ClientsIcon, ExpenseIcon, NotebookIcon } from './icons';

interface BottomNavProps {
  view: 'generator' | 'dashboard' | 'history' | 'invoices' | 'clients' | 'expenses' | 'journal';
  setView: (view: 'generator' | 'dashboard' | 'history' | 'invoices' | 'clients' | 'expenses' | 'journal') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ view, setView }) => {
  const navItems = [
    { name: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { name: 'generator', label: 'Generator', icon: GenerateIcon },
    { name: 'clients', label: 'Clients', icon: ClientsIcon },
    { name: 'journal', label: 'Diary', icon: NotebookIcon },
    { name: 'history', label: 'History', icon: HistoryIcon },
    { name: 'invoices', label: 'Invoices', icon: InvoiceIcon },
    { name: 'expenses', label: 'Expenses', icon: ExpenseIcon },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-brand-dark border-t border-border-color dark:border-slate-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40 overflow-x-auto">
      <nav className="flex justify-between items-center h-full min-w-full px-2">
        {navItems.map((item) => {
          const isActive = view === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setView(item.name as any)}
              aria-label={`Go to ${item.label}`}
              className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-colors duration-200 px-1 ${
                isActive ? 'text-gold-dark' : 'text-gray-500 dark:text-slate-400 hover:text-gold-dark'
              }`}
            >
              <item.icon className={`w-5 h-5 mb-0.5 transform transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;