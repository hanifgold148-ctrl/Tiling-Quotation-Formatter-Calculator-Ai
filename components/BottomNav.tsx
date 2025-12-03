import React from 'react';
import { GenerateIcon, DashboardIcon, HistoryIcon, InvoiceIcon, ClientsIcon, ExpenseIcon } from './icons';

interface BottomNavProps {
  view: 'generator' | 'dashboard' | 'history' | 'invoices' | 'clients' | 'expenses';
  setView: (view: 'generator' | 'dashboard' | 'history' | 'invoices' | 'clients' | 'expenses') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ view, setView }) => {
  const navItems = [
    { name: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { name: 'generator', label: 'Generator', icon: GenerateIcon },
    { name: 'clients', label: 'Clients', icon: ClientsIcon },
    { name: 'history', label: 'History', icon: HistoryIcon },
    { name: 'invoices', label: 'Invoices', icon: InvoiceIcon },
    { name: 'expenses', label: 'Expenses', icon: ExpenseIcon },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-brand-dark border-t border-border-color dark:border-slate-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
      <nav className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = view === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setView(item.name as 'generator' | 'dashboard' | 'history' | 'invoices' | 'clients' | 'expenses')}
              aria-label={`Go to ${item.label}`}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-gold-dark' : 'text-gray-500 dark:text-slate-400 hover:text-gold-dark'
              }`}
            >
              <item.icon className={`w-6 h-6 mb-1 transform transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-xs font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-0 h-0'}`}>{item.label}</span>
              <span className={`text-xs font-medium transition-all ${!isActive ? 'opacity-100' : 'opacity-0 h-0'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;