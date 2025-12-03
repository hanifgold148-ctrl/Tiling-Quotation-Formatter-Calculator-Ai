

import { supabase } from './supabaseClient';
import { QuotationData, InvoiceData, Client, Expense, Settings, JournalEntry } from '../types';

// Helper to get current user
const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// --- QUOTATIONS ---
export const fetchQuotations = async (): Promise<QuotationData[]> => {
    const { data, error } = await supabase.from('quotations').select('data').order('updated_at', { ascending: false });
    if (error) {
        console.error('Error fetching quotations:', error);
        return [];
    }
    return data.map(row => row.data);
};

export const saveQuotation = async (quotation: QuotationData) => {
    const user = await getUser();
    if (!user) throw new Error("No user logged in");
    
    const { error } = await supabase.from('quotations').upsert({
        id: quotation.id,
        user_id: user.id,
        data: quotation,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
};

export const deleteQuotation = async (id: string) => {
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) throw error;
};

// --- INVOICES ---
export const fetchInvoices = async (): Promise<InvoiceData[]> => {
    const { data, error } = await supabase.from('invoices').select('data').order('updated_at', { ascending: false });
    if (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
    return data.map(row => row.data);
};

export const saveInvoice = async (invoice: InvoiceData) => {
    const user = await getUser();
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase.from('invoices').upsert({
        id: invoice.id,
        user_id: user.id,
        data: invoice,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
};

export const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
};

// --- CLIENTS ---
export const fetchClients = async (): Promise<Client[]> => {
    const { data, error } = await supabase.from('clients').select('data');
    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
    return data.map(row => row.data);
};

export const saveClient = async (client: Client) => {
    const user = await getUser();
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase.from('clients').upsert({
        id: client.id,
        user_id: user.id,
        data: client,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
};

export const deleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
};

// --- EXPENSES ---
export const fetchExpenses = async (): Promise<Expense[]> => {
    const { data, error } = await supabase.from('expenses').select('data');
    if (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
    return data.map(row => row.data);
};

export const saveExpense = async (expense: Expense) => {
    const user = await getUser();
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase.from('expenses').upsert({
        id: expense.id,
        user_id: user.id,
        data: expense,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
};

export const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
};

// --- SETTINGS ---
export const fetchSettings = async (): Promise<Settings | null> => {
    const user = await getUser();
    if (!user) return null;
    
    const { data, error } = await supabase.from('settings').select('data').eq('user_id', user.id).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error("Error fetching settings", error);
    }
    return data ? data.data : null;
};

export const saveSettings = async (settings: Settings) => {
    const user = await getUser();
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase.from('settings').upsert({
        user_id: user.id,
        data: settings,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
};

// --- JOURNAL ENTRIES ---
export const fetchJournalEntries = async (): Promise<JournalEntry[]> => {
    const { data, error } = await supabase.from('journal_entries').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching journal entries:', error);
        return [];
    }
    // Map db columns to interface if needed, but they match mostly.
    // The date field in interface is number (timestamp), but db might return string for created_at.
    // However, we added a specific 'date' column in the conceptual model in prev steps? 
    // Wait, the SQL provided by user only had title, content, created_at.
    // We should map created_at to date if date is missing, or store date as a number in the content if possible?
    // Let's stick to the SQL schema: id, user_id, title, content, created_at.
    // We will cast created_at to our date number for the frontend.
    
    return data.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        date: new Date(row.created_at).getTime(),
        created_at: row.created_at
    }));
};

export const saveJournalEntry = async (entry: JournalEntry) => {
    const user = await getUser();
    if (!user) throw new Error("No user logged in");

    const payload = {
        user_id: user.id,
        title: entry.title,
        content: entry.content,
        // We use created_at to store the "Date" of the entry for sorting
        created_at: new Date(entry.date).toISOString(),
        updated_at: new Date().toISOString()
    };

    if (entry.id && entry.id.length > 10) { // Check if valid UUID-ish
         const { error } = await supabase.from('journal_entries').update(payload).eq('id', entry.id);
         if (error) throw error;
    } else {
        const { error } = await supabase.from('journal_entries').insert(payload);
        if (error) throw error;
    }
};

export const deleteJournalEntry = async (id: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) throw error;
};