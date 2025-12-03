
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { QuotationData, ClientDetails, Settings, InvoiceData, Client, Expense, User, JournalEntry } from './types';
import { generateQuotationFromAI, getTextFromImageAI } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import * as db from './services/dbService';
import InputSection from './components/InputSection';
import QuotationDisplay from './components/QuotationDisplay';
import ImageCropper from './components/ImageCropper';
import { HanifgoldLogoIcon, GenerateIcon, SettingsIcon, SunIcon, MoonIcon, DashboardIcon, ClientsIcon, HistoryIcon, InvoiceIcon, ExpenseIcon, PlusIcon, NotebookIcon } from './components/icons';
import ClientDetailsForm from './components/ClientDetailsForm';
import LoadingSpinner from './components/LoadingSpinner';
import AddMaterialModal from './components/AddMaterialModal';
import EditTilesModal from './components/EditTilesModal';
import EditChecklistModal from './components/EditChecklistModal';
import AddAdjustmentModal from './components/AddAdjustmentModal';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Invoices from './components/Invoices';
import Clients from './components/Clients';
import Expenses from './components/Expenses';
import Journal from './components/Journal';
import ExpenseModal from './components/ExpenseModal';
import ClientModal from './components/ClientModal';
import SettingsModal from './components/SettingsModal';
import JournalModal from './components/JournalModal';
import BottomNav from './components/BottomNav';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import InvoiceModal from './components/InvoiceModal';
import BulkGeneratorModal from './components/BulkGeneratorModal';
import BulkSuccessModal from './components/BulkSuccessModal';
import { DEFAULT_SETTINGS } from './constants';
import { exportQuotesToZip } from './services/exportService';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Auth from './components/Auth';


// Custom hook for managing state with undo/redo capabilities
const useHistoryState = <T,>(initialState: T) => {
  const [history, setHistory] = useState({
    past: [] as T[],
    present: initialState,
    future: [] as T[],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const set = useCallback((action: T | ((prevState: T) => T)) => {
    setHistory(current => {
      const newState = typeof action === 'function' 
        ? (action as (prevState: T) => T)(current.present) 
        : action;
        
      if (JSON.stringify(newState) === JSON.stringify(current.present)) {
        return current;
      }
      return {
        past: [...current.past, current.present],
        present: newState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (!canUndo) return;
    setHistory(current => {
      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    setHistory(current => {
      const next = current.future[0];
      const newFuture = current.future.slice(1);
      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, [canRedo]);
  
  const reset = useCallback((newState: T) => {
      setHistory({
          past: [],
          present: newState,
          future: []
      });
  }, []);

  return { state: history.present, set, undo, redo, canUndo, canRedo, reset };
};


interface AuthenticatedAppProps {
    currentUser: User;
    onLogout: () => void;
    theme: 'light' | 'dark';
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ currentUser, onLogout, theme, setTheme }) => {
  const [view, setView] = useState<'generator' | 'dashboard' | 'history' | 'invoices' | 'clients' | 'expenses' | 'journal'>('dashboard');
  const { state: jobNotes, set: setJobNotes, undo: undoJobNotes, redo: redoJobNotes, canUndo: canUndoJobNotes, canRedo: canRedoJobNotes, reset: resetJobNotes } = useHistoryState<string[]>([]);
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null);
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  
  const [allQuotations, setAllQuotations] = useState<QuotationData[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceData[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allJournalEntries, setAllJournalEntries] = useState<JournalEntry[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Initial Data Fetch from Supabase
  useEffect(() => {
      const loadData = async () => {
          setIsDataLoading(true);
          try {
              const [fetchedSettings, fetchedQuotes, fetchedInvoices, fetchedClients, fetchedExpenses, fetchedJournal] = await Promise.all([
                  db.fetchSettings(),
                  db.fetchQuotations(),
                  db.fetchInvoices(),
                  db.fetchClients(),
                  db.fetchExpenses(),
                  db.fetchJournalEntries()
              ]);
              
              if (fetchedSettings) setSettings({ ...DEFAULT_SETTINGS, ...fetchedSettings });
              setAllQuotations(fetchedQuotes || []);
              setAllInvoices(fetchedInvoices || []);
              setAllClients(fetchedClients || []);
              setAllExpenses(fetchedExpenses || []);
              setAllJournalEntries(fetchedJournal || []);
          } catch (error) {
              console.error("Failed to load data from Supabase", error);
              // Fallback or error state handling could go here
          } finally {
              setIsDataLoading(false);
          }
      };
      loadData();
  }, []);

  const [historyFilterIds, setHistoryFilterIds] = useState<string[] | null>(null);

  // Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isEditTilesOpen, setIsEditTilesOpen] = useState(false);
  const [isEditChecklistOpen, setIsEditChecklistOpen] = useState(false);
  const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingJournalEntry, setEditingJournalEntry] = useState<JournalEntry | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number, total: number, message: string } | null>(null);
  const [isBulkSuccessOpen, setIsBulkSuccessOpen] = useState(false);
  const [bulkGeneratedQuotes, setBulkGeneratedQuotes] = useState<QuotationData[]>([]);
  
  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const isDismissed = localStorage.getItem('pwaPromptDismissed');
      if (!isDismissed) {
        setShowInstallPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  // Form State
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    projectName: '',
    showClientName: true,
    showClientAddress: true,
    showClientPhone: true,
    showProjectName: true,
  });
  const [saveClientInfo, setSaveClientInfo] = useState(false);
  
  // Image Cropper
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Handlers wrapped to update state AND Supabase
  
  const handleUpdateSettings = async (newSettings: Settings) => {
      setSettings(newSettings);
      try {
          await db.saveSettings(newSettings);
      } catch (e) {
          console.error("Failed to save settings", e);
      }
  };

  const handleQuotationUpdate = async (updatedQuotation: QuotationData) => {
      setQuotationData(updatedQuotation);
      setAllQuotations(prev => prev.map(q => q.id === updatedQuotation.id ? updatedQuotation : q));
      try {
          await db.saveQuotation(updatedQuotation);
      } catch (e) {
          console.error("Failed to update quotation in DB", e);
      }
  };

  const handleGenerate = async () => {
      if (jobNotes.length === 0) {
          alert("Please add at least one note or upload an image.");
          return;
      }
      
      setQuotationData(null);

      try {
        const textInput = jobNotes.join('\n');
        const combinedInput = `
            Client Name: ${clientDetails.clientName}
            Client Address: ${clientDetails.clientAddress}
            Client Phone: ${clientDetails.clientPhone}
            Project Name: ${clientDetails.projectName}
            Job Notes: ${textInput}
        `;

        const data = await generateQuotationFromAI(combinedInput, settings, settings.addCheckmateDefault, settings.showChecklistDefault);
        
        const newQuotation: QuotationData = {
            id: crypto.randomUUID(),
            date: Date.now(),
            status: 'Pending',
            ...data,
            clientDetails: {
                ...data.clientDetails,
                showClientName: clientDetails.showClientName,
                showClientAddress: clientDetails.showClientAddress,
                showClientPhone: clientDetails.showClientPhone,
                showProjectName: clientDetails.showProjectName,
                clientId: clientDetails.clientId,
            },
             showMaterials: settings.showMaterialsDefault,
             showAdjustments: settings.showAdjustmentsDefault,
        };

        setQuotationData(newQuotation);
        setAllQuotations(prev => [newQuotation, ...prev]);
        await db.saveQuotation(newQuotation);
        
        // Auto-save client if checked
        if (saveClientInfo && newQuotation.clientDetails.clientName && !newQuotation.clientDetails.clientId) {
            const newClient: Client = {
                id: crypto.randomUUID(),
                name: newQuotation.clientDetails.clientName,
                address: newQuotation.clientDetails.clientAddress,
                phone: newQuotation.clientDetails.clientPhone,
            };
            setAllClients(prev => [...prev, newClient]);
            await db.saveClient(newClient);
            // Link client to quote
            const linkedQuote = { ...newQuotation, clientDetails: { ...newQuotation.clientDetails, clientId: newClient.id } };
            setQuotationData(linkedQuote);
            setAllQuotations(prev => prev.map(q => q.id === linkedQuote.id ? linkedQuote : q));
            await db.saveQuotation(linkedQuote);
        }

      } catch (error: any) {
          console.error(error);
          // Show the actual error message to the user (e.g. "API Key missing")
          alert(error.message || "Failed to generate quotation. Please try again.");
      }
  };

  // Image Handling
  const handleImageUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
          setSelectedImage(reader.result as string);
          setShowCropper(true);
      };
      reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedFile: File) => {
      setShowCropper(false);
      setIsOcrLoading(true);
      try {
          const text = await getTextFromImageAI(croppedFile);
          setJobNotes(prev => [...prev, ...text.split('\n').filter(line => line.trim() !== '')]);
          setSelectedImage(URL.createObjectURL(croppedFile));
      } catch (error) {
          console.error(error);
          alert("Failed to extract text from image.");
          setSelectedImage(null);
      } finally {
          setIsOcrLoading(false);
      }
  };

  const handleCropCancel = () => {
      setShowCropper(false);
      setSelectedImage(null);
  };

  // Data Management Handlers
  const handleBackup = () => {
      const backupData = {
          version: 1,
          date: new Date().toISOString(),
          user: currentUser.email,
          quotations: allQuotations,
          invoices: allInvoices,
          clients: allClients,
          expenses: allExpenses,
          journal: allJournalEntries,
          settings: settings
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hanifgold_Backup_${new Date().toISOString().split('T')[0]}_${currentUser.name.replace(/\s+/g,'_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  // Note: Restore is complicated with Cloud DB. We might just append or overwrite locally then sync.
  // For simplicity, we'll keep it local alert for now or implement full restore logic.
  const handleRestore = (file: File) => {
      alert("Restore functionality is limited when using cloud sync. Data will be merged.");
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              // Here we would ideally loop through and upsert all to supabase
              if (data.quotations) {
                  for (const q of data.quotations) await db.saveQuotation(q);
                  setAllQuotations(await db.fetchQuotations());
              }
              // ... same for others
              alert('Data restore initiated. Please refresh to see changes.');
          } catch (err) {
              console.error(err);
              alert('Failed to restore data.');
          }
      };
      reader.readAsText(file);
  };
  
  const handleViewQuotation = (id: string) => {
      const quote = allQuotations.find(q => q.id === id);
      if (quote) {
          setQuotationData(quote);
          setClientDetails(quote.clientDetails); 
          setJobNotes([]); 
          resetJobNotes([]); 
          setView('generator');
      }
  };
  
  const handleDuplicateQuotation = async (id: string) => {
      const quote = allQuotations.find(q => q.id === id);
      if (quote) {
          const newQuote = { 
              ...quote, 
              id: crypto.randomUUID(), 
              date: Date.now(), 
              status: 'Pending' as const,
              invoiceId: undefined,
              clientDetails: { ...quote.clientDetails, projectName: `${quote.clientDetails.projectName} (Copy)` }
          };
          setAllQuotations(prev => [newQuote, ...prev]);
          await db.saveQuotation(newQuote);
          alert("Quotation duplicated successfully.");
      }
  };

  const handleDeleteQuotation = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this quotation?")) {
        setAllQuotations(prev => prev.filter(q => q.id !== id));
        if (quotationData?.id === id) {
            setQuotationData(null);
        }
        await db.deleteQuotation(id);
      }
  };

  const handleConvertToInvoice = async (id: string) => {
      const quote = allQuotations.find(q => q.id === id);
      if (!quote) return;
      if (quote.invoiceId) {
          alert("This quotation has already been invoiced.");
          return;
      }

      const prefix = settings.invoicePrefix || 'INV';
      const year = new Date().getFullYear();
      let nextSequence = 1;
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^${escapedPrefix}-${year}-(\\d+)`);

      allInvoices.forEach(inv => {
          const match = inv.invoiceNumber.match(pattern);
          if (match) {
              const currentNum = parseInt(match[1], 10);
              if (!isNaN(currentNum) && currentNum >= nextSequence) {
                  nextSequence = currentNum + 1;
              }
          }
      });

      let newInvoiceNumber = `${prefix}-${year}-${String(nextSequence).padStart(4, '0')}`;
      while (allInvoices.some(inv => inv.invoiceNumber === newInvoiceNumber)) {
          nextSequence++;
          newInvoiceNumber = `${prefix}-${year}-${String(nextSequence).padStart(4, '0')}`;
      }

      const newInvoice: InvoiceData = {
          id: crypto.randomUUID(),
          quotationId: quote.id,
          invoiceNumber: newInvoiceNumber,
          invoiceDate: Date.now(),
          dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
          status: 'Unpaid',
          clientDetails: quote.clientDetails,
          tiles: quote.tiles,
          materials: quote.materials,
          workmanshipRate: quote.workmanshipRate,
          maintenance: quote.maintenance,
          profitPercentage: quote.profitPercentage,
          paymentTerms: 'Due on Receipt',
          bankDetails: settings.defaultBankDetails,
          invoiceNotes: settings.defaultInvoiceNotes,
          showMaterials: quote.showMaterials,
          showAdjustments: quote.showAdjustments,
      };
      
      setAllInvoices(prev => [newInvoice, ...prev]);
      await db.saveInvoice(newInvoice);

      const updatedQuote = { ...quote, status: 'Invoiced' as const, invoiceId: newInvoice.id };
      handleQuotationUpdate(updatedQuote);
      
      setView('invoices');
      setEditingInvoice(newInvoice);
      setIsInvoiceModalOpen(true);
  };
  
  // Client Management
  const handleSaveClient = async (client: Client) => {
      const clientToSave = client.id ? client : { ...client, id: crypto.randomUUID() };
      
      if (client.id) {
          setAllClients(prev => prev.map(c => c.id === client.id ? clientToSave : c));
      } else {
          setAllClients(prev => [...prev, clientToSave]);
      }
      await db.saveClient(clientToSave);
      setIsClientModalOpen(false);
      setEditingClient(null);
  };
  
  const handleDeleteClient = async (id: string) => {
      if (window.confirm("Delete this client?")) {
          setAllClients(prev => prev.filter(c => c.id !== id));
          await db.deleteClient(id);
      }
  };

  // Expense Management
  const handleSaveExpense = async (expense: Expense) => {
      const expenseToSave = expense.id ? expense : { ...expense, id: crypto.randomUUID() };
      if (expense.id) {
          setAllExpenses(prev => prev.map(e => e.id === expense.id ? expenseToSave : e));
      } else {
          setAllExpenses(prev => [...prev, expenseToSave]);
      }
      await db.saveExpense(expenseToSave);
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
  };
  
  const handleDeleteExpense = async (id: string) => {
      if (window.confirm("Delete this expense record?")) {
          setAllExpenses(prev => prev.filter(e => e.id !== id));
          await db.deleteExpense(id);
      }
  };

  // Journal Management
  const handleSaveJournalEntry = async (entry: JournalEntry) => {
      const entryToSave = entry.id ? entry : { ...entry, id: crypto.randomUUID() };
      if (entry.id) {
          setAllJournalEntries(prev => prev.map(e => e.id === entry.id ? entryToSave : e));
      } else {
          setAllJournalEntries(prev => [entryToSave, ...prev]);
      }
      await db.saveJournalEntry(entryToSave);
      setIsJournalModalOpen(false);
      setEditingJournalEntry(null);
  };

  const handleDeleteJournalEntry = async (id: string) => {
      if (window.confirm("Delete this diary entry?")) {
          setAllJournalEntries(prev => prev.filter(e => e.id !== id));
          await db.deleteJournalEntry(id);
      }
  };
  
  // Invoice Management
  const handleSaveInvoice = async (invoice: InvoiceData) => {
      setAllInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));
      await db.saveInvoice(invoice);
      setIsInvoiceModalOpen(false);
      setEditingInvoice(null);
  };
  
  const handleDeleteInvoice = async (id: string) => {
      if (window.confirm("Delete this invoice?")) {
          const inv = allInvoices.find(i => i.id === id);
          setAllInvoices(prev => prev.filter(i => i.id !== id));
          await db.deleteInvoice(id);
          if (inv && inv.quotationId) {
              const quote = allQuotations.find(q => q.id === inv.quotationId);
              if (quote) {
                  const updated = { ...quote, status: 'Accepted' as const, invoiceId: undefined };
                  setAllQuotations(prev => prev.map(q => q.id === updated.id ? updated : q));
                  await db.saveQuotation(updated);
              }
          }
      }
  }

  // Voice Command Handler
  const handleVoiceCommand = (command: string) => {
      const cmd = command.toLowerCase();
      setIsVoiceModalOpen(false);
      if (cmd.includes('dashboard')) setView('dashboard');
      else if (cmd.includes('history')) setView('history');
      else if (cmd.includes('invoices')) setView('invoices');
      else if (cmd.includes('clients')) setView('clients');
      else if (cmd.includes('expenses')) setView('expenses');
      else if (cmd.includes('diary') || cmd.includes('journal')) setView('journal');
      else if (cmd.includes('create quotation') || cmd.includes('generator')) setView('generator');
      else if (cmd.includes('add note') && view === 'generator') {
          setJobNotes(prev => [...prev, cmd.replace('add note', '').trim()]);
      }
  };

  // Bulk Generation Handler
  const handleBulkGenerate = async (mode: 'sameClient' | 'sameJob' | 'csv', data: any) => {
      setIsBulkModalOpen(false);
      setBulkGeneratedQuotes([]);
      
      let tasks: { client: ClientDetails; text: string }[] = [];
      
      if (mode === 'sameClient') {
          const { client, jobs } = data;
          tasks = jobs.map((job: string) => ({ client, text: job }));
      } else if (mode === 'sameJob') {
          const { job, clients } = data;
          tasks = clients.map((client: ClientDetails) => ({ client, text: job }));
      } else if (mode === 'csv') {
          tasks = data.tasks;
      }
      
      if (tasks.length === 0) return;
      
      setBulkProgress({ current: 0, total: tasks.length, message: 'Starting bulk generation...' });
      setIsBulkModalOpen(true);

      const generated: QuotationData[] = [];

      for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          setBulkProgress({ current: i + 1, total: tasks.length, message: `Generating quote for ${task.client.clientName}...` });
          
          try {
              const combinedInput = `
                Client Name: ${task.client.clientName}
                Client Address: ${task.client.clientAddress}
                Client Phone: ${task.client.clientPhone}
                Project Name: ${task.client.projectName}
                Job Notes: ${task.text}
              `;
              
              const aiData = await generateQuotationFromAI(combinedInput, settings, settings.addCheckmateDefault, settings.showChecklistDefault);
              const newQuote: QuotationData = {
                  id: crypto.randomUUID(),
                  date: Date.now(),
                  status: 'Pending',
                  ...aiData,
                  isBulkGenerated: true,
                  clientDetails: {
                       ...aiData.clientDetails,
                       showClientName: true, 
                       showClientAddress: true,
                       showClientPhone: true,
                       showProjectName: true,
                  },
                  showMaterials: settings.showMaterialsDefault,
                  showAdjustments: settings.showAdjustmentsDefault,
              };
              
              generated.push(newQuote);
              await db.saveQuotation(newQuote);
              
          } catch (e) {
              console.error(`Failed to generate for ${task.client.clientName}`, e);
          }
      }
      
      setAllQuotations(prev => [...generated, ...prev]);
      setBulkGeneratedQuotes(generated);
      setBulkProgress(null);
      setIsBulkModalOpen(false);
      setIsBulkSuccessOpen(true);
  };
  
  const handleBulkSuccessAction = (action: 'view' | 'download' | 'history') => {
      setIsBulkSuccessOpen(false);
      if (action === 'view') {
          setHistoryFilterIds(bulkGeneratedQuotes.map(q => q.id));
          setView('history');
      } else if (action === 'download') {
          exportQuotesToZip(bulkGeneratedQuotes, settings);
      } else if (action === 'history') {
          setHistoryFilterIds(null);
          setView('history');
      }
  };

  if (isDataLoading) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
              <LoadingSpinner />
          </div>
      )
  }

  // Main Render
  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-[#0a0f1c] text-slate-700 dark:text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-24 hover:w-64 bg-white dark:bg-[#151e32] border-r-0 m-4 rounded-3xl h-[calc(100vh-2rem)] flex-shrink-0 shadow-2xl z-30 transition-all duration-300 ease-in-out overflow-hidden group">
        
        {/* Sidebar Header */}
        <div className="p-6 flex items-center gap-4 justify-center group-hover:justify-start whitespace-nowrap">
           <div className="bg-gold/10 p-2 rounded-xl">
              <HanifgoldLogoIcon className="w-8 h-8" />
           </div>
           <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="font-bold text-lg text-brand-dark dark:text-white leading-tight block font-display">Hanifgold</span>
           </div>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-grow px-3 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {[
            { name: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
            { name: 'generator', label: 'Generator', icon: GenerateIcon },
            { name: 'clients', label: 'Clients', icon: ClientsIcon },
            { name: 'journal', label: 'Site Diary', icon: NotebookIcon },
            { name: 'history', label: 'History', icon: HistoryIcon },
            { name: 'invoices', label: 'Invoices', icon: InvoiceIcon },
            { name: 'expenses', label: 'Expenses', icon: ExpenseIcon },
          ].map(item => {
             const isActive = view === item.name;
             return (
               <button
                  key={item.name}
                  onClick={() => setView(item.name as any)}
                  className={`w-full flex items-center gap-4 px-3 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 whitespace-nowrap relative overflow-hidden ${
                      isActive 
                      ? 'bg-gold text-white shadow-lg shadow-gold/30' 
                      : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:text-slate-400'
                  }`}
               >
                  <div className="flex-shrink-0 flex items-center justify-center w-8">
                      <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  </div>
                  <span className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 ${isActive ? 'font-bold' : ''}`}>
                      {item.label}
                  </span>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20"></div>}
               </button>
             );
          })}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-3 mt-auto space-y-2 mb-2">
           <button 
                onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:text-slate-400 transition-colors whitespace-nowrap"
            >
                <div className="flex-shrink-0 flex items-center justify-center w-8">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6 text-gold" />}
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Theme</span>
           </button>
           <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:text-slate-400 transition-colors whitespace-nowrap"
            >
                <div className="flex-shrink-0 flex items-center justify-center w-8">
                    <SettingsIcon className="w-6 h-6" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Settings</span>
           </button>
           
           <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap"
            >
                <div className="flex-shrink-0 flex items-center justify-center w-8">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">Log Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative md:py-4 md:pr-4">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white dark:bg-[#151e32] border-b border-border-color dark:border-border-dark flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <HanifgoldLogoIcon className="w-8 h-8" />
                    <span className="font-bold text-brand-dark dark:text-white font-display">Hanifgold</span>
                </div>
             </div>
             <div className="flex items-center gap-4">
                 <button onClick={onLogout} className="h-9 w-9 rounded-full bg-gold-light text-gold-dark border border-gold/20 flex items-center justify-center text-sm font-bold shadow-sm" title="Log Out">
                     {currentUser.name.substring(0,2).toUpperCase()}
                 </button>
             </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0f172a] md:rounded-3xl shadow-xl md:border border-white/20 dark:border-slate-700 relative">
             
             {/* Top Bar */}
             <div className="sticky top-0 z-20 px-6 py-4 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                 <div>
                    <h2 className="text-xl font-bold text-brand-dark dark:text-white capitalize tracking-tight font-display">
                        {view === 'generator' ? 'Quotation Generator' : view === 'journal' ? 'Site Diary' : view.charAt(0).toUpperCase() + view.slice(1)}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back, {currentUser.name}</p>
                 </div>
                 <div className="hidden md:flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                         {currentUser.name.substring(0,2).toUpperCase()}
                      </div>
                 </div>
             </div>

             <div className="p-4 md:p-8 max-w-[1600px] mx-auto h-full">
                {view === 'dashboard' && <Dashboard quotations={allQuotations} invoices={allInvoices} expenses={allExpenses} settings={settings} />}
                
                {view === 'generator' && (
                <div className="grid xl:grid-cols-12 gap-6 h-full">
                    {/* Left Panel: Input Form */}
                    <div className="xl:col-span-5 flex flex-col gap-6">
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-1 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <ClientDetailsForm 
                                details={clientDetails} 
                                setDetails={setClientDetails} 
                                disabled={!!quotationData} 
                                allClients={allClients}
                                saveClientInfo={saveClientInfo}
                                setSaveClientInfo={setSaveClientInfo}
                            />
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-1 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <InputSection
                                notes={jobNotes}
                                setNotes={setJobNotes}
                                disabled={!!quotationData}
                                onImageUpload={handleImageUpload}
                                onRemoveImage={() => { setSelectedImage(null); setShowCropper(false); }}
                                imagePreview={selectedImage}
                                isOcrLoading={isOcrLoading}
                                onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                                onOpenBulkModal={() => setIsBulkModalOpen(true)}
                                onUndo={undoJobNotes}
                                onRedo={redoJobNotes}
                                canUndo={canUndoJobNotes}
                                canRedo={canRedoJobNotes}
                            />
                        </div>
                        
                        {!quotationData ? (
                            <button
                                onClick={handleGenerate}
                                disabled={isOcrLoading} 
                                className="w-full py-4 bg-brand-dark hover:bg-black text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                            >
                                {isOcrLoading ? <LoadingSpinner /> : <GenerateIcon className="w-5 h-5 text-gold" />}
                                Generate Quotation
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setQuotationData(null);
                                    setJobNotes([]);
                                    resetJobNotes([]);
                                    setClientDetails({
                                        clientName: '', clientAddress: '', clientPhone: '', projectName: '',
                                        showClientName: true, showClientAddress: true, showClientPhone: true, showProjectName: true
                                    });
                                    setSaveClientInfo(false);
                                }}
                                className="w-full py-4 bg-white dark:bg-surface-dark border-2 border-gold text-gold-dark font-bold rounded-2xl shadow-sm hover:bg-gold-light/20 transition flex items-center justify-center gap-3"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Start New Quotation
                            </button>
                        )}
                    </div>
                    
                    {/* Right Panel: Document Preview */}
                    <div className="xl:col-span-7 flex flex-col">
                        <div className="bg-gray-100 dark:bg-[#151e32] rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden relative shadow-inner h-[calc(100vh-180px)] min-h-[600px]">
                            <div className="absolute top-0 left-0 right-0 h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-center border-b border-gray-200 dark:border-gray-700 z-10">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Live Preview
                                </span>
                            </div>
                            <div className="absolute inset-0 pt-16 pb-8 px-4 overflow-y-auto custom-scrollbar flex justify-center">
                                <QuotationDisplay 
                                    data={quotationData} 
                                    isLoading={false} 
                                    settings={settings}
                                    onAddMaterial={() => setIsAddMaterialOpen(true)}
                                    onEditTiles={() => setIsEditTilesOpen(true)}
                                    onEditChecklist={() => setIsEditChecklistOpen(true)}
                                    onAddAdjustment={() => setIsAddAdjustmentOpen(true)}
                                    onUpdate={handleQuotationUpdate}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {view === 'clients' && (
                    <Clients 
                        clients={allClients} 
                        quotations={allQuotations}
                        onAdd={() => { setEditingClient(null); setIsClientModalOpen(true); }}
                        onEdit={(client) => { setEditingClient(client); setIsClientModalOpen(true); }}
                        onDelete={handleDeleteClient}
                        onViewQuotes={(clientId) => {
                            setHistoryFilterIds(allQuotations.filter(q => q.clientDetails.clientId === clientId).map(q => q.id));
                            setView('history');
                        }}
                    />
                )}

                {view === 'history' && (
                    <History 
                        quotations={allQuotations} 
                        onView={handleViewQuotation} 
                        onDuplicate={handleDuplicateQuotation}
                        onDelete={handleDeleteQuotation}
                        onUpdateStatus={handleQuotationUpdate}
                        onConvertToInvoice={handleConvertToInvoice}
                        settings={settings}
                        activeFilterIds={historyFilterIds}
                        onFilterChange={() => setHistoryFilterIds(null)} 
                    />
                )}
                
                {view === 'invoices' && (
                    <Invoices 
                        invoices={allInvoices}
                        settings={settings}
                        onEdit={(id) => {
                            const inv = allInvoices.find(i => i.id === id);
                            if (inv) { setEditingInvoice(inv); setIsInvoiceModalOpen(true); }
                        }}
                        onDelete={handleDeleteInvoice}
                        onUpdate={handleSaveInvoice}
                    />
                )}

                {view === 'expenses' && (
                    <Expenses 
                        expenses={allExpenses}
                        quotations={allQuotations}
                        onAdd={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
                        onEdit={(expense) => { setEditingExpense(expense); setIsExpenseModalOpen(true); }}
                        onDelete={handleDeleteExpense}
                    />
                )}

                {view === 'journal' && (
                    <Journal 
                        entries={allJournalEntries}
                        onAdd={() => { setEditingJournalEntry(null); setIsJournalModalOpen(true); }}
                        onEdit={(entry) => { setEditingJournalEntry(entry); setIsJournalModalOpen(true); }}
                        onDelete={handleDeleteJournalEntry}
                    />
                )}
             </div>
        </main>

        {/* Mobile Navigation */}
        <BottomNav view={view} setView={setView} />

      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && <PWAInstallPrompt onInstall={handleInstallClick} onDismiss={handleDismissInstall} />}

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onSave={handleUpdateSettings} 
        onBackup={handleBackup}
        onRestore={handleRestore}
      />
      
      <AddMaterialModal 
        isOpen={isAddMaterialOpen} 
        onClose={() => setIsAddMaterialOpen(false)} 
        onSave={(material) => {
            if (quotationData) {
                const updated = { ...quotationData, materials: [...quotationData.materials, material] };
                handleQuotationUpdate(updated);
            }
        }} 
        settings={settings}
      />

      <EditTilesModal 
        isOpen={isEditTilesOpen} 
        onClose={() => setIsEditTilesOpen(false)} 
        onSave={(updatedTiles) => {
            if (quotationData) handleQuotationUpdate({ ...quotationData, tiles: updatedTiles });
            setIsEditTilesOpen(false);
        }}
        currentTiles={quotationData?.tiles || []}
        settings={settings}
      />

      <EditChecklistModal
         isOpen={isEditChecklistOpen}
         onClose={() => setIsEditChecklistOpen(false)}
         onSave={(updatedChecklist) => {
             if (quotationData) handleQuotationUpdate({ ...quotationData, checklist: updatedChecklist });
             setIsEditChecklistOpen(false);
         }}
         currentChecklist={quotationData?.checklist || []}
      />
      
      <AddAdjustmentModal 
          isOpen={isAddAdjustmentOpen}
          onClose={() => setIsAddAdjustmentOpen(false)}
          onSave={(updatedAdjustments) => {
              if (quotationData) handleQuotationUpdate({ ...quotationData, adjustments: updatedAdjustments });
              setIsAddAdjustmentOpen(false);
          }}
          currentAdjustments={quotationData?.adjustments || []}
      />
      
      <ExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={editingExpense}
        quotations={allQuotations}
        settings={settings}
      />
      
      <ClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={editingClient}
      />

      <JournalModal 
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSave={handleSaveJournalEntry}
        entryToEdit={editingJournalEntry}
      />
      
      <VoiceAssistantModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onCommand={handleVoiceCommand}
      />
      
      {editingInvoice && (
          <InvoiceModal 
            isOpen={isInvoiceModalOpen}
            onClose={() => setIsInvoiceModalOpen(false)}
            onSave={handleSaveInvoice}
            invoice={editingInvoice}
            settings={settings}
          />
      )}
      
      <BulkGeneratorModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onGenerate={handleBulkGenerate}
        progress={bulkProgress}
      />
      
      <BulkSuccessModal 
        isOpen={isBulkSuccessOpen}
        onClose={() => setIsBulkSuccessOpen(false)}
        generatedQuotes={bulkGeneratedQuotes}
        onDownloadZip={() => handleBulkSuccessAction('download')}
        onViewInHistory={() => handleBulkSuccessAction('view')}
        onGoToHistory={() => handleBulkSuccessAction('history')}
      />

      {showCropper && selectedImage && (
        <ImageCropper 
            imageSrc={selectedImage} 
            onConfirm={handleCropConfirm} 
            onCancel={handleCropCancel} 
        />
      )}
    </div>
  );
};


const THEME_KEY = 'theme';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) return savedTheme as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    let mounted = true;

    // Check active Supabase session
    const getSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                if (session?.user) {
                    setCurrentUser({
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata.full_name || 'User'
                    });
                } else {
                    setCurrentUser(null);
                }
            }
        } catch (e) {
            console.error("Auth check failed", e);
        } finally {
            if (mounted) setIsLoading(false);
        }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            setCurrentUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata.full_name || 'User'
            });
        } else {
            setCurrentUser(null);
        }
        // Ensure loading is off if a change event occurs
        setIsLoading(false);
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />; // Auth component handles login
  }

  return (
    <AuthenticatedApp 
      key={currentUser.id} 
      currentUser={currentUser} 
      onLogout={handleLogout}
      theme={theme}
      setTheme={setTheme}
    />
  );
};

export default App;