

import React, { useState, useRef, KeyboardEvent } from 'react';
import { ClientDetails } from '../types';
import { PlusIcon, RemoveIcon, BulkGenerateIcon, UploadIcon, EditIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

type BulkMode = 'sameClient' | 'sameJob' | 'csv';
type CsvTask = { client: ClientDetails; text: string };

interface BulkGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (
        mode: BulkMode,
        data: { client: ClientDetails; jobs: string[] } | { job: string; clients: ClientDetails[] } | { tasks: CsvTask[] }
    ) => void;
    progress: { current: number; total: number; message: string } | null;
}

const defaultClient: ClientDetails = {
    clientName: '', clientAddress: '', clientPhone: '', projectName: '',
    showClientName: true, showClientAddress: true, showClientPhone: true, showProjectName: true,
};

const BulkGeneratorModal: React.FC<BulkGeneratorModalProps> = ({ isOpen, onClose, onGenerate, progress }) => {
    const [mode, setMode] = useState<BulkMode>('sameClient');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvError, setCsvError] = useState<string | null>(null);
    const [parsedTasks, setParsedTasks] = useState<CsvTask[]>([]);

    // State for 'sameClient' mode
    const [client, setClient] = useState<ClientDetails>(defaultClient);
    const [jobs, setJobs] = useState<string[]>([]);
    const [currentJobNote, setCurrentJobNote] = useState('');

    // State for 'sameJob' mode
    const [job, setJob] = useState<string>('');
    const [clients, setClients] = useState<ClientDetails[]>([]);
    const [currentClient, setCurrentClient] = useState<ClientDetails>(defaultClient);
    const [editingClientIndex, setEditingClientIndex] = useState<number | null>(null);

    const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClient(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const addJob = () => {
        if (currentJobNote.trim()) {
            setJobs([...jobs, currentJobNote.trim()]);
            setCurrentJobNote('');
        }
    };
    const handleJobKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addJob();
      }
    }
    const removeJob = (index: number) => setJobs(jobs.filter((_, i) => i !== index));
    
    const handleAddClient = () => {
        if(currentClient.clientName.trim() === '') return;
        setClients([...clients, currentClient]);
        setCurrentClient(defaultClient);
    };

    const handleUpdateClient = () => {
        if (editingClientIndex === null || !currentClient.clientName.trim()) return;
        const newClients = [...clients];
        newClients[editingClientIndex] = currentClient;
        setClients(newClients);
        setCurrentClient(defaultClient);
        setEditingClientIndex(null);
    };

    const editClient = (index: number) => {
        setEditingClientIndex(index);
        setCurrentClient(clients[index]);
    };
    
    const removeClient = (index: number) => setClients(clients.filter((_, i) => i !== index));

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCsvError(null);
        setParsedTasks([]);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const tasks = parseCsv(text);
                if (tasks.length === 0) {
                    throw new Error("CSV is empty or has an invalid format. Please use the template.");
                }
                setParsedTasks(tasks);
            } catch (error: any) {
                setCsvError(error.message);
            }
        };
        reader.onerror = () => {
            setCsvError("Failed to read the file.");
        };
        reader.readAsText(file);
    };

    const parseCsv = (csvText: string): CsvTask[] => {
        const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
        if (lines.length < 2) {
            throw new Error("CSV is empty or contains only a header.");
        }
        
        const headerLine = lines.shift();
        if (!headerLine) throw new Error("CSV has no header line.");
        
        const header = headerLine.trim().toLowerCase().split(',').map(h => h.trim());
        const requiredHeaders = ['client_name', 'job_notes'];
        if (!requiredHeaders.every(h => header.includes(h))) {
            throw new Error(`Invalid CSV headers. Missing required headers: ${requiredHeaders.join(', ')}. Please use the template.`);
        }

        const tasks: CsvTask[] = [];
        for (const line of lines) {
            if (!line.trim()) continue;
            const values = line.split(',');
            const row: { [key: string]: string } = {};
            header.forEach((h, index) => {
                row[h] = values[index]?.trim() || '';
            });

            if (!row.client_name || !row.job_notes) {
                console.warn("Skipping CSV row due to missing required data:", line);
                continue;
            }
            
            tasks.push({
                client: {
                    clientName: row.client_name,
                    clientAddress: row.client_address || '',
                    clientPhone: row.client_phone || '',
                    projectName: row.project_name || '',
                    showClientName: true,
                    showClientAddress: true,
                    showClientPhone: true,
                    showProjectName: true,
                },
                text: row.job_notes
            });
        }
        return tasks;
    };
    
    const handleDownloadTemplate = () => {
        const headers = "client_name,client_address,client_phone,project_name,job_notes";
        const exampleRow = "John Doe,123 Ikoyi Lagos,08012345678,Lekki Residence,Master Bedroom 30m2 60x60 floor tiles and Cement 5 bags";
        const csvContent = `${headers}\n${exampleRow}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "bulk_quote_template.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handleGenerateClick = () => {
        if (mode === 'sameClient') {
            const validJobs = jobs.filter(j => j.trim() !== '');
            if (client.clientName.trim() && validJobs.length > 0) {
                onGenerate('sameClient', { client, jobs: validJobs });
            }
        } else if (mode === 'sameJob') {
            const validClients = clients.filter(c => c.clientName.trim() !== '');
            if (job.trim() && validClients.length > 0) {
                onGenerate('sameJob', { job, clients: validClients });
            }
        } else if (mode === 'csv') {
            if (parsedTasks.length > 0) {
                onGenerate('csv', { tasks: parsedTasks });
            }
        }
    };

    if (!isOpen) return null;
    
    const isGenerating = !!progress;

    const isGenerateDisabled = () => {
        if (isGenerating) return true;
        if (mode === 'sameClient') return !client.clientName.trim() || jobs.length === 0;
        if (mode === 'sameJob') return !job.trim() || clients.length === 0;
        if (mode === 'csv') return parsedTasks.length === 0;
        return true;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-border-color dark:border-slate-700">
                    <h2 className="text-xl font-bold text-brand-dark dark:text-white">Bulk Quotation Generator</h2>
                    <p className="text-sm text-gray-500">Create multiple quotations at once to save time.</p>
                </div>
                
                {isGenerating ? (
                    <div className="p-8 flex-grow flex flex-col items-center justify-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-lg font-semibold text-brand-dark dark:text-white">{progress.message}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-gold h-2.5 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{progress.current} of {progress.total} Complete</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b dark:border-slate-700">
                            <div className="flex bg-brand-light dark:bg-slate-800 p-1 rounded-lg">
                                <button onClick={() => setMode('sameClient')} className={`w-1/3 p-2 rounded-md font-semibold text-sm transition ${mode === 'sameClient' ? 'bg-white dark:bg-slate-700 shadow text-gold-dark' : 'text-gray-600'}`}>Same Client</button>
                                <button onClick={() => setMode('sameJob')} className={`w-1/3 p-2 rounded-md font-semibold text-sm transition ${mode === 'sameJob' ? 'bg-white dark:bg-slate-700 shadow text-gold-dark' : 'text-gray-600'}`}>Same Job</button>
                                <button onClick={() => setMode('csv')} className={`w-1/3 p-2 rounded-md font-semibold text-sm transition ${mode === 'csv' ? 'bg-white dark:bg-slate-700 shadow text-gold-dark' : 'text-gray-600'}`}>Import CSV</button>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow">
                            {mode === 'sameClient' && (
                                <div className="space-y-4">
                                    <div className="p-4 border dark:border-slate-700 rounded-lg">
                                        <h3 className="font-bold text-brand-dark dark:text-white mb-2">Client Details</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input name="clientName" value={client.clientName} onChange={handleClientChange} placeholder="Client Name*" className="input-field" />
                                            <input name="clientAddress" value={client.clientAddress} onChange={handleClientChange} placeholder="Client Address" className="input-field" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-dark dark:text-white">Job Notes</h3>
                                        {jobs.length > 0 && (
                                            <div className="p-2 bg-brand-light/60 dark:bg-slate-800 rounded-lg border dark:border-slate-700 max-h-40 overflow-y-auto space-y-2">
                                                {jobs.map((jobText, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gold-light text-gold-darker rounded-md p-2 text-sm">
                                                        <span>{jobText}</span>
                                                        <button onClick={() => removeJob(index)} className="p-1 rounded-full hover:bg-gold-lightest"><RemoveIcon className="w-4 h-4"/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <input value={currentJobNote} onChange={(e) => setCurrentJobNote(e.target.value)} onKeyDown={handleJobKeyDown} placeholder={`Add job note...`} className="input-field flex-grow" />
                                            <button onClick={addJob} disabled={!currentJobNote.trim()} className="p-2 bg-gold text-brand-dark rounded-lg disabled:bg-gray-400 disabled:text-white"><PlusIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {mode === 'sameJob' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-bold text-brand-dark dark:text-white mb-2">Common Job Notes</h3>
                                        <textarea value={job} onChange={(e) => setJob(e.target.value)} placeholder="Enter the job notes to apply to all clients..." className="input-field w-full" rows={3}></textarea>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-brand-dark dark:text-white">Client List ({clients.length})</h3>
                                        {clients.length > 0 && (
                                            <div className="p-2 bg-brand-light/60 dark:bg-slate-800 rounded-lg border dark:border-slate-700 max-h-40 overflow-y-auto space-y-2">
                                                {clients.map((c, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-indigo-100 text-indigo-800 rounded-md p-2 text-sm">
                                                        <div>
                                                            <p className="font-semibold">{c.clientName}</p>
                                                            <p className="text-xs">{c.clientAddress}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => editClient(index)} className="p-1 rounded-full hover:bg-indigo-200"><EditIcon className="w-4 h-4"/></button>
                                                            <button onClick={() => removeClient(index)} className="p-1 rounded-full hover:bg-indigo-200"><RemoveIcon className="w-4 h-4"/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="p-3 border dark:border-slate-700 rounded-lg space-y-2">
                                            <h4 className="text-sm font-semibold">{editingClientIndex !== null ? 'Editing Client' : 'Add New Client'}</h4>
                                            <div className="flex items-center gap-2">
                                                <input value={currentClient.clientName} onChange={e => setCurrentClient(p => ({...p, clientName: e.target.value}))} placeholder="Client Name*" className="input-field flex-grow" />
                                                <input value={currentClient.clientAddress} onChange={e => setCurrentClient(p => ({...p, clientAddress: e.target.value}))} placeholder="Address" className="input-field flex-grow" />
                                                {editingClientIndex !== null ? (
                                                    <button onClick={handleUpdateClient} className="p-2 bg-success text-white rounded-lg">Update</button>
                                                ) : (
                                                    <button onClick={handleAddClient} disabled={!currentClient.clientName.trim()} className="p-2 bg-gold text-brand-dark rounded-lg disabled:bg-gray-400 disabled:text-white"><PlusIcon className="w-5 h-5"/></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {mode === 'csv' && (
                                <div className="text-center space-y-4">
                                    <h3 className="text-lg font-bold text-brand-dark dark:text-white">Import from a CSV file</h3>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                                        For complex jobs, upload a CSV to generate all quotations at once.
                                        Note: The parser is simple; please avoid using commas within any field.
                                    </p>
                                    <button onClick={handleDownloadTemplate} className="text-gold-dark font-semibold hover:underline">
                                        Download CSV Template
                                    </button>
                                    <div className="flex flex-col items-center justify-center bg-brand-light dark:bg-slate-800 border-2 border-dashed border-border-color dark:border-slate-600 rounded-lg p-6 hover:border-gold transition-colors min-h-[10rem]">
                                        <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100"
                                        >
                                            <UploadIcon className="w-5 h-5" />
                                            Upload CSV File
                                        </button>
                                        <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                                        <p className="mt-2 text-xs text-gray-500">.csv files up to 1MB</p>
                                    </div>
                                    {csvError && <p className="text-danger">{csvError}</p>}
                                    {parsedTasks.length > 0 && (
                                        <div className="text-left bg-green-50 text-success p-3 rounded-lg border border-green-200">
                                            <p className="font-bold">File parsed successfully!</p>
                                            <p>{parsedTasks.length} quotations will be generated.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-end gap-4">
                            <button onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600">Cancel</button>
                            <button 
                                onClick={handleGenerateClick}
                                disabled={isGenerateDisabled()}
                                className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark flex items-center gap-2 disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed"
                            >
                                <BulkGenerateIcon className="w-5 h-5"/>
                                Generate All Quotes
                            </button>
                        </div>
                    </>
                )}
                {/* FIX: Moved the style tag inside the parent div to resolve JSX syntax error. */}
                <style>{`
                    .input-field {
                        padding: 8px 12px;
                        border: 1px solid #E5E7EB; /* border-color */
                        border-radius: 8px;
                        font-size: 14px;
                        width: 100%;
                        background-color: #F9FAFB;
                    }
                    .dark .input-field {
                        background-color: #1f2937;
                        border-color: #374151;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default BulkGeneratorModal;
