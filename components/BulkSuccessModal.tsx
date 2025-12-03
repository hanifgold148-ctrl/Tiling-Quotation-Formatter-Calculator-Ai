import React from 'react';
import { QuotationData } from '../types';
import { CheckCircleIcon, ZipIcon, HistoryIcon, ViewIcon } from './icons';

interface BulkSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    generatedQuotes: QuotationData[];
    onDownloadZip: () => void;
    onViewInHistory: () => void;
    onGoToHistory: () => void;
}

const BulkSuccessModal: React.FC<BulkSuccessModalProps> = ({ 
    isOpen, onClose, generatedQuotes, onDownloadZip, onViewInHistory, onGoToHistory 
}) => {
    if (!isOpen) return null;

    const successfulCount = generatedQuotes.length;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full text-center p-8">
                <CheckCircleIcon className="w-16 h-16 text-success mx-auto" />
                <h2 className="text-2xl font-bold text-brand-dark dark:text-white mt-4">Generation Complete</h2>
                <p className="text-gray-600 dark:text-slate-300 mt-2">
                    Successfully generated <span className="font-bold text-gold-dark">{successfulCount}</span> new quotation{successfulCount !== 1 ? 's' : ''}.
                </p>

                <div className="mt-6 space-y-3">
                     <button 
                        onClick={onDownloadZip}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-success text-white font-bold rounded-lg hover:bg-emerald-600 transition shadow-md"
                     >
                        <ZipIcon className="w-5 h-5"/>
                        Download All as .ZIP
                    </button>
                     <button 
                        onClick={onViewInHistory}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-sky-100 text-info font-bold rounded-lg hover:bg-sky-200 transition"
                    >
                        <ViewIcon className="w-5 h-5"/>
                        View Generated Quotes in History
                    </button>
                    <button 
                        onClick={onGoToHistory}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                    >
                        <HistoryIcon className="w-5 h-5"/>
                        Go to Full History
                    </button>
                </div>

                <div className="mt-8">
                    <button onClick={onClose} className="text-sm font-semibold text-gray-500 hover:text-brand-dark dark:hover:text-white">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkSuccessModal;