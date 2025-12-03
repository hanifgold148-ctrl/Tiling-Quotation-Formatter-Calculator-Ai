import React, { useState, useRef, useEffect, useMemo } from 'react';
import { QuotationData, Settings, Tile, Material, ChecklistItem, Adjustment } from '../types';
import { HanifgoldLogoIcon, SpeakerIcon, PlusIcon, EditIcon, ExportIcon, CsvIcon, CheckCircleIcon, CorporateIcon, MinimalistIcon, WordIcon, PdfIcon, CheckmateIcon, ShareIcon, MailIcon, ViewIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { generateSpeechFromText, getAiSummaryForTts } from '../services/geminiService';
import { exportToPdf, exportToExcel, exportToWord, exportToCsv } from '../services/exportService';
import { calculateTotals } from '../services/calculationService';

// Audio decoding functions (unchanged)
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


interface QuotationDisplayProps {
  data: QuotationData | null;
  isLoading: boolean;
  settings: Settings;
  onAddMaterial: () => void;
  onEditTiles: () => void;
  onEditChecklist: () => void;
  onAddAdjustment: () => void;
  onUpdate: (updatedQuotation: QuotationData) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};


const QuotationDisplay: React.FC<QuotationDisplayProps> = ({ data, isLoading, settings, onAddMaterial, onEditTiles, onEditChecklist, onAddAdjustment, onUpdate }) => {
    const [previewStyle, setPreviewStyle] = useState<'corporate' | 'minimalist'>('corporate');
    const [isTtsLoading, setIsTtsLoading] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

    const exportMenuRef = useRef<HTMLDivElement>(null);
    const viewMenuRef = useRef<HTMLDivElement>(null);

    const { 
        showMaintenance: showMaintenanceGlobal, 
        showSubtotal, 
        showUnitPrice,
        showTermsAndConditions: showTermsGlobal,
        showTileSize,
        showTax: showTaxGlobal,
        headerLayout,
        companyLogo,
        companySignature
    } = settings;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
                setIsViewMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const groupedTiles = useMemo<Record<string, Tile[]>>(() => {
        if (!data) return {};
        const groups: Record<string, Tile[]> = {};
        data.tiles.forEach(tile => {
            const groupName = tile.group || 'General';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(tile);
        });
        return groups;
    }, [data]);

    const getGroupTotal = (tiles: Tile[]) => {
        return tiles.reduce((sum, tile) => sum + (tile.cartons * tile.unitPrice), 0);
    };
    
    const handleStatusChange = (newStatus: 'Accepted' | 'Rejected') => {
        if (data) {
            onUpdate({ ...data, status: newStatus });
        }
    };
    
    const handleChecklistToggle = (index: number) => {
        if (!data || !data.checklist) return;
        const newChecklist = [...data.checklist];
        newChecklist[index] = { ...newChecklist[index], checked: !newChecklist[index].checked };
        onUpdate({ ...data, checklist: newChecklist });
    };

    const handleAddCheckmateToggle = (enabled: boolean) => {
        if (!data) return;
        const hasCheckmate = data.checklist?.some(item => item.item === 'Checkmate');
        let newChecklist = [...(data.checklist || [])];

        if (enabled && !hasCheckmate) {
            newChecklist.push({ item: 'Checkmate', checked: false });
        } else if (!enabled && hasCheckmate) {
            newChecklist = newChecklist.filter(item => item.item !== 'Checkmate');
        }
        
        onUpdate({ ...data, addCheckmate: enabled, checklist: newChecklist });
    };

    const handleShowChecklistToggle = (enabled: boolean) => data && onUpdate({ ...data, showChecklist: enabled });
    const handleShowMaterialsToggle = (enabled: boolean) => data && onUpdate({ ...data, showMaterials: enabled });
    const handleShowAdjustmentsToggle = (enabled: boolean) => data && onUpdate({ ...data, showAdjustments: enabled });
    
    const handleShowBankDetailsToggle = (enabled: boolean) => data && onUpdate({ ...data, showBankDetails: enabled });
    const handleShowTermsToggle = (enabled: boolean) => data && onUpdate({ ...data, showTerms: enabled });
    const handleShowWorkmanshipToggle = (enabled: boolean) => data && onUpdate({ ...data, showWorkmanship: enabled });
    const handleShowMaintenanceToggle = (enabled: boolean) => data && onUpdate({ ...data, showMaintenance: enabled });
    const handleShowTaxToggle = (enabled: boolean) => data && onUpdate({ ...data, showTax: enabled });
    const handleShowCostSummaryToggle = (enabled: boolean) => data && onUpdate({ ...data, showCostSummary: enabled });


    const handleShare = () => {
        if (!data) return;
        const summary = calculateTotals(data, settings);
        const subject = `Quotation for ${data.clientDetails.projectName || data.clientDetails.clientName}`;
        const body = `Hello ${data.clientDetails.clientName},\n\nHere is the summary of your quotation for the ${data.clientDetails.projectName} project.\n\nTotal Estimated Cost: ${formatCurrency(summary.grandTotal)}\n\nPlease see the attached PDF for full details.\n\nBest regards,\n${settings.companyName}`;
        
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setIsExportMenuOpen(false);
    };
    
    const renderHeader = () => {
        if (!data) return null;
        const isMinimalist = previewStyle === 'minimalist';
        
        // Company Info Block
        const companyInfo = (
             <div>
                <h1 className="text-2xl font-bold text-brand-dark tracking-wide">{settings.companyName}</h1>
                <p className="text-xs text-gold-dark font-bold uppercase tracking-widest mt-1">{settings.companySlogan}</p>
                <div className="mt-3 text-xs text-gray-600 leading-relaxed">
                    <p>{settings.companyAddress}</p>
                    <p>{settings.companyEmail} | {settings.companyPhone}</p>
                </div>
            </div>
        );

        // Document Title & Date Block (The "Perfect" Right Side)
        const rightSection = (
            <div className="text-right shrink-0">
                <h2 className="text-4xl font-bold text-gold tracking-tight uppercase">{settings.documentTitle}</h2>
                <div className="text-sm text-gray-500 mt-3 space-y-1">
                    <p><span className="font-medium text-brand-dark">Date:</span> {new Date(data.date).toLocaleDateString()}</p>
                    {data.invoiceNumber && <p><span className="font-medium text-brand-dark">Invoice #:</span> {data.invoiceNumber}</p>}
                    {data.dueDate && <p><span className="font-medium text-brand-dark">Due Date:</span> {new Date(data.dueDate).toLocaleDateString()}</p>}
                </div>
            </div>
        );

        return (
            <div className="mb-8">
                {/* Modern Layout: Logo/Company Left, Title/Date Right */}
                {headerLayout !== 'classic' ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                        <div className="flex items-start gap-4">
                             {companyLogo ? 
                                <img src={companyLogo} alt="Company Logo" className="w-20 h-20 object-contain"/> : 
                                <HanifgoldLogoIcon className="w-16 h-16 flex-shrink-0" />}
                            {companyInfo}
                        </div>
                        {rightSection}
                    </div>
                ) : (
                    /* Classic Layout: Centered */
                    <div className="flex flex-col items-center text-center gap-4">
                        {companyLogo && <img src={companyLogo} alt="Company Logo" className="w-24 h-24 object-contain"/>}
                        {companyInfo}
                        <div className="w-full mt-4 border-t border-gold/50 pt-4">
                            <h2 className="text-3xl font-bold text-gold tracking-tight uppercase">{settings.documentTitle}</h2>
                            <p className="text-sm text-gray-500 mt-1">{new Date(data.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}
                
                <div className="pt-6">
                     <div className="border-b border-gold"></div>
                </div>
            </div>
        );
    };


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                    <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4 shadow-lg"></div>
                    <p className="text-brand-dark dark:text-white font-bold text-lg">Generating Quote...</p>
                    <p className="text-gray-400 text-sm mt-2">Analyzing notes and calculating costs.</p>
                </div>
            );
        }
        
        if (!data) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                    <div className="bg-white/50 dark:bg-white/5 p-8 rounded-3xl mb-6 backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-xl">
                         <HanifgoldLogoIcon className="w-24 h-24 opacity-40 grayscale" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-2">Ready to Generate</h2>
                    <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                        Enter your job notes on the left to create a professional, print-ready quotation.
                    </p>
                </div>
            );
        }

        const { 
            clientDetails, materials, status, termsAndConditions, checklist, addCheckmate, adjustments, depositPercentage, 
            showChecklist, showMaterials, showAdjustments,
            showBankDetails, showTerms, showWorkmanship, showMaintenance, showTax, showCostSummary
        } = data;

        const summary = calculateTotals(data, settings);
        
        let sectionCounter = 1;
        const getSectionNumber = () => sectionCounter++;

        const handleReadAloud = async () => {
            if (!data) return;
            setIsTtsLoading(true);
            try {
                const summaryText = await getAiSummaryForTts(data, summary.grandTotal);
                const base64Audio = await generateSpeechFromText(summaryText);
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            } catch (error) {
                console.error("Failed to play audio", error);
                alert("Sorry, the audio summary could not be generated at this time.");
            } finally {
                setIsTtsLoading(false);
            }
        };

        const StatusIndicator = () => {
            const baseClasses = "px-3 py-1 text-xs font-bold rounded-full inline-flex items-center gap-2 uppercase tracking-wider shadow-sm";
            if (status === 'Accepted') return <span className={`${baseClasses} bg-emerald-100 text-emerald-700 border border-emerald-200`}><CheckCircleIcon className="w-4 h-4" /> Accepted</span>;
            if (status === 'Rejected') return <span className={`${baseClasses} bg-red-100 text-red-700 border border-red-200`}>Rejected</span>;
            if (status === 'Invoiced') return <span className={`${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`}>Invoiced</span>;
            return <span className={`${baseClasses} bg-amber-100 text-amber-700 border border-amber-200`}>Pending Review</span>;
        }

        const ToggleSwitch = ({ id, checked, onChange, label }: { id: string, checked: boolean, onChange: (c: boolean) => void, label: string }) => (
            <div className="flex items-center gap-2">
                {label && <label htmlFor={id} className="text-xs font-semibold cursor-pointer select-none text-gray-500 hover:text-brand-dark transition-colors">{label}</label>}
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                    <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-gold/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gold"></div>
                </label>
            </div>
        );


        return (
            <div className="flex flex-col w-full max-w-[210mm]">
                {/* Controls Toolbar - Floating Glass Pill */}
                <div className="sticky top-2 z-30 mx-auto w-full max-w-3xl">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-lg border border-white/20 dark:border-white/10 ring-1 ring-black/5">
                         <div className="flex items-center gap-3 pl-2">
                            <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                                <button onClick={() => setPreviewStyle('corporate')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewStyle === 'corporate' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-dark dark:text-white' : 'text-gray-400'}`}>Classic</button>
                                <button onClick={() => setPreviewStyle('minimalist')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewStyle === 'minimalist' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-dark dark:text-white' : 'text-gray-400'}`}>Clean</button>
                            </div>
                            <StatusIndicator />
                         </div>

                         <div className="flex items-center gap-1">
                            {/* Visibility Menu */}
                            <div className="relative" ref={viewMenuRef}>
                                <button
                                    onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors flex items-center gap-2"
                                    title="View Options"
                                >
                                    <ViewIcon className="w-5 h-5" />
                                </button>

                                {isViewMenuOpen && (
                                    <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl z-40 border border-gray-100 dark:border-slate-700 animate-fade-in p-4 ring-1 ring-black/5">
                                         <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Section Visibility</h4>
                                         <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Materials</span>
                                                <ToggleSwitch id="menuShowMaterials" checked={showMaterials ?? true} onChange={handleShowMaterialsToggle} label="" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Adjustments</span>
                                                <ToggleSwitch id="menuShowAdjustments" checked={showAdjustments ?? true} onChange={handleShowAdjustmentsToggle} label="" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Checklist</span>
                                                <ToggleSwitch id="menuShowChecklist" checked={showChecklist ?? true} onChange={handleShowChecklistToggle} label="" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost Summary</span>
                                                <ToggleSwitch id="menuShowCostSummary" checked={showCostSummary ?? true} onChange={handleShowCostSummaryToggle} label="" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Details</span>
                                                <ToggleSwitch id="menuShowBankDetails" checked={showBankDetails ?? true} onChange={handleShowBankDetailsToggle} label="" />
                                            </div>
                                             <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Terms</span>
                                                <ToggleSwitch id="menuShowTerms" checked={showTerms ?? showTermsGlobal} onChange={handleShowTermsToggle} label="" />
                                            </div>
                                         </div>
                                         
                                         <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4 border-b border-gray-100 dark:border-gray-700 pb-2">Cost Breakdown Details</h4>
                                         <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Workmanship</span>
                                                <ToggleSwitch id="menuShowWorkmanship" checked={showWorkmanship ?? true} onChange={handleShowWorkmanshipToggle} label="" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance</span>
                                                <ToggleSwitch id="menuShowMaintenance" checked={showMaintenance ?? showMaintenanceGlobal} onChange={handleShowMaintenanceToggle} label="" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax</span>
                                                <ToggleSwitch id="menuShowTax" checked={showTax ?? showTaxGlobal} onChange={handleShowTaxToggle} label="" />
                                            </div>
                                         </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={handleReadAloud} disabled={isTtsLoading} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors" title="Read Aloud">
                                 {isTtsLoading ? <LoadingSpinner /> : <SpeakerIcon className="w-5 h-5" />}
                            </button>
                            <div className="relative" ref={exportMenuRef}>
                                <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white font-bold text-xs rounded-xl hover:bg-black transition-all shadow-md hover:shadow-lg">
                                    <ExportIcon className="w-3.5 h-3.5" /> Export
                                </button>
                                 {isExportMenuOpen && (
                                    <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl z-40 border border-gray-100 dark:border-slate-700 animate-fade-in p-2 ring-1 ring-black/5">
                                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Download Format</div>
                                        <button onClick={() => { exportToPdf(data, settings); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"><PdfIcon className="w-5 h-5 text-red-500"/> PDF Document</button>
                                        <button onClick={async () => { await exportToWord(data, settings); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"><WordIcon className="w-5 h-5 text-blue-600"/> Word (.docx)</button>
                                        <div className="my-2 border-t border-gray-100 dark:border-slate-700"></div>
                                        <button onClick={handleShare} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"><MailIcon className="w-5 h-5 text-gray-400"/> Email Quote</button>
                                    </div>
                                )}
                            </div>
                            {status === 'Pending' && (
                                <div className="flex gap-1 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                                    <button onClick={() => handleStatusChange('Accepted')} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors" title="Accept"><CheckCircleIcon className="w-5 h-5"/></button>
                                </div>
                            )}
                         </div>
                    </div>
                </div>

                {/* The Paper Document */}
                <div id="quotation-output" className="paper-sheet rounded-lg p-12 text-slate-800 relative mb-12 mt-6 transform transition-transform hover:scale-[1.005] duration-500">
                    {renderHeader()}
                    
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-10 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</h3>
                            <div className="text-sm space-y-1.5 text-brand-dark">
                                {clientDetails.showClientName && <p className="font-bold text-lg">{clientDetails.clientName || 'Client Name'}</p>}
                                {clientDetails.showProjectName && <p className="font-medium text-gray-600">{clientDetails.projectName}</p>}
                                {clientDetails.showClientAddress && <p>{clientDetails.clientAddress}</p>}
                                {clientDetails.showClientPhone && <p>{clientDetails.clientPhone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Tile Details Table */}
                    <section className="mb-8 relative group/section">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <h3 className="text-md font-bold text-brand-dark font-serif tracking-tight"><span className="text-gold font-sans mr-2">{getSectionNumber()}.</span>Tile Details</h3>
                             {/* Explicit Z-Index high to be clickable */}
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTiles();
                                }} 
                                className="relative z-20 text-xs font-bold text-gold-dark hover:text-white hover:bg-gold bg-gold-light border border-gold/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all print:hidden uppercase tracking-wide shadow-sm"
                            >
                                <EditIcon className="w-3 h-3" /> Edit Tiles
                            </button>
                        </div>
                         
                        {Object.keys(groupedTiles).length > 0 ? (
                            Object.entries(groupedTiles).map(([groupName, groupTiles]: [string, Tile[]]) => (
                                <div key={groupName} className="mb-6 last:mb-0">
                                    {groupName !== 'General' && (
                                        <div className="bg-gray-100 px-2 py-1 rounded inline-block mb-2">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{groupName}</h4>
                                        </div>
                                    )}
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-300">
                                            <tr>
                                                <th className="pb-2 pl-2">Category</th>
                                                <th className="pb-2 text-right">Area (m²)</th>
                                                <th className="pb-2 text-right">Cartons</th>
                                                {showTileSize && <th className="pb-2 pl-4">Size</th>}
                                                <th className="pb-2 pl-4">Type</th>
                                                {showUnitPrice && <th className="pb-2 text-right">Price</th>}
                                                {showSubtotal && <th className="pb-2 text-right pr-2">Total</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {groupTiles.map((tile: Tile, index: number) => (
                                                <tr key={index} className="group hover:bg-gray-50/80 transition-colors">
                                                    <td className="py-2 pl-2 font-medium text-slate-800">{tile.category}</td>
                                                    <td className="py-2 text-right text-gray-600">{tile.sqm.toFixed(2)}</td>
                                                    <td className="py-2 text-right text-gray-600">{tile.cartons}</td>
                                                    {showTileSize && <td className="py-2 pl-4 text-gray-600">{tile.size || '-'}</td>}
                                                    <td className="py-2 pl-4 text-gray-600">{tile.tileType}</td>
                                                    {showUnitPrice && <td className="py-2 text-right text-gray-600">{formatCurrency(tile.unitPrice)}</td>}
                                                    {showSubtotal && <td className="py-2 text-right font-medium text-slate-800 pr-2">{formatCurrency(tile.cartons * tile.unitPrice)}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {showSubtotal && (
                                        <div className="flex justify-end mt-1 pr-2">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Subtotal: <span className="text-slate-800 font-bold ml-1 text-xs">{formatCurrency(getGroupTotal(groupTiles))}</span></p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-4 italic text-sm border border-dashed border-gray-200 rounded-lg">No tiles added yet.</div>
                        )}
                    </section>

                    {/* Materials Section */}
                    <section className="mb-8 relative group/section">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                             <h3 className="text-md font-bold text-brand-dark font-serif tracking-tight"><span className="text-gold font-sans mr-2">{getSectionNumber()}.</span>Materials</h3>
                             <div className="flex items-center gap-3 print:hidden relative z-20">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddMaterial();
                                    }} 
                                    className="text-xs font-bold text-gold-dark hover:text-white hover:bg-gold bg-gold-light border border-gold/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all uppercase tracking-wide shadow-sm"
                                >
                                    <PlusIcon className="w-3 h-3" /> Add Material
                                </button>
                             </div>
                        </div>
                        
                        {(showMaterials ?? true) ? (
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-300">
                                <tr>
                                    <th className="pb-2 pl-2">Item</th>
                                    <th className="pb-2 text-right">Qty</th>
                                    {showUnitPrice && <th className="pb-2 text-right">Price</th>}
                                    {showSubtotal && <th className="pb-2 text-right pr-2">Total</th>}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {materials.map((mat: Material, index: number) => (
                                    <tr key={index} className="group hover:bg-gray-50/80 transition-colors">
                                    <td className="py-2 pl-2 font-medium text-slate-800">{mat.item}</td>
                                    <td className="py-2 text-right text-gray-600">{mat.quantity} <span className="text-[10px] text-gray-400 uppercase">{mat.unit}</span></td>
                                    {showUnitPrice && <td className="py-2 text-right text-gray-600">{formatCurrency(mat.unitPrice)}</td>}
                                    {showSubtotal && <td className="py-2 text-right font-medium text-slate-800 pr-2">{formatCurrency(mat.quantity * mat.unitPrice)}</td>}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : <div className="p-2 bg-gray-50 rounded text-xs text-gray-400 text-center italic border border-dashed border-gray-200">Section hidden</div>}
                    </section>
                    
                    {/* Adjustments Section */}
                    {(showAdjustments ?? true) && adjustments && adjustments.length > 0 && (
                        <section className="mb-8 relative group/section">
                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                                <h3 className="text-md font-bold text-brand-dark font-serif tracking-tight"><span className="text-gold font-sans mr-2">{getSectionNumber()}.</span>Adjustments</h3>
                                <div className="flex items-center gap-3 print:hidden relative z-20">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddAdjustment();
                                        }} 
                                        className="text-xs font-bold text-gold-dark hover:text-white hover:bg-gold bg-gold-light border border-gold/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all uppercase tracking-wide shadow-sm"
                                    >
                                        <EditIcon className="w-3 h-3" /> Edit
                                    </button>
                                </div>
                            </div>
                             <div className="bg-gray-50 rounded border border-gray-100 p-3">
                                {adjustments.map((adj, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-dotted border-gray-200 last:border-0">
                                        <span className="font-medium text-slate-700">{adj.description}</span>
                                        <span className={`font-bold ${adj.amount < 0 ? 'text-green-600' : 'text-slate-800'}`}>{formatCurrency(adj.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}


                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                         {/* Checklist Section */}
                         <section className="relative group/section">
                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                                <h3 className="text-md font-bold text-brand-dark font-serif tracking-tight"><span className="text-gold font-sans mr-2">{getSectionNumber()}.</span>Checklist</h3>
                                <div className="flex items-center gap-3 print:hidden relative z-20">
                                     <ToggleSwitch id="checkmateToggle" checked={addCheckmate ?? true} onChange={handleAddCheckmateToggle} label="Checkmate" />
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditChecklist();
                                        }} 
                                        className="text-xs font-bold text-gold-dark hover:text-white hover:bg-gold bg-gold-light border border-gold/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all uppercase tracking-wide shadow-sm"
                                    >
                                        <EditIcon className="w-3 h-3" /> Edit
                                    </button>
                                </div>
                            </div>
                            {(showChecklist ?? true) && (
                                <div className="space-y-1">
                                    {(checklist && checklist.length > 0) ? checklist.map((item, index) => {
                                        const isCheckmate = item.item === 'Checkmate';
                                        return (
                                            <div key={index} className={`flex items-start gap-2 p-1.5 rounded ${isCheckmate ? 'bg-gold/5 border border-gold/20' : ''}`}>
                                                <div className={`mt-1 h-3 w-3 rounded-sm border flex items-center justify-center ${item.checked ? 'bg-brand-dark border-brand-dark text-white' : 'border-gray-400'}`}>
                                                    {item.checked && <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                </div>
                                                <span className={`text-xs flex-1 leading-tight ${item.checked ? 'text-gray-400 line-through' : 'text-slate-700'} ${isCheckmate ? 'font-bold text-brand-dark' : ''}`}>
                                                    {item.item}
                                                </span>
                                                <input type="checkbox" checked={item.checked} onChange={() => handleChecklistToggle(index)} className="hidden" />
                                                <div className="absolute inset-0 cursor-pointer print:hidden" onClick={() => handleChecklistToggle(index)}></div>
                                            </div>
                                        );
                                    }) : <p className="text-xs text-gray-400 italic">No checklist items.</p>}
                                </div>
                            )}
                        </section>
                        
                        {/* Cost Summary Section */}
                        <section className="flex flex-col relative group/section">
                            <div className="bg-brand-dark text-white p-6 rounded-xl shadow-paper relative overflow-hidden">
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                    <h3 className="text-lg font-bold font-serif text-gold tracking-tight">Estimate Summary</h3>
                                </div>

                                {(showCostSummary ?? true) ? (
                                    <div className="space-y-2 relative z-10 text-sm">
                                        <div className="flex justify-between text-white/70"><span>Tiles</span> <span className="font-medium text-white">{formatCurrency(summary.totalTileCost)}</span></div>
                                        {(showMaterials ?? true) && <div className="flex justify-between text-white/70"><span>Materials</span> <span className="font-medium text-white">{formatCurrency(summary.totalMaterialCost)}</span></div>}
                                        
                                        {(showWorkmanship ?? true) && (
                                            <div className="flex justify-between text-white/70">
                                                <span>Labor <span className="text-[10px] opacity-50">({formatCurrency(data.workmanshipRate)}/m²)</span></span>
                                                <span className="font-medium text-white">{formatCurrency(summary.workmanshipCost)}</span>
                                            </div>
                                        )}

                                        {(showMaintenance ?? showMaintenanceGlobal) && data.maintenance > 0 && <div className="flex justify-between text-white/70"><span>Maintenance</span> <span className="font-medium text-white">{formatCurrency(data.maintenance)}</span></div>}
                                        {data.profitPercentage && <div className="flex justify-between text-white/70"><span>Profit</span> <span className="font-medium text-white">{formatCurrency(summary.profitAmount)}</span></div>}
                                        
                                        <div className="h-px bg-white/10 my-2"></div>
                                        
                                        {(showAdjustments ?? true) && summary.totalAdjustments !== 0 && <div className="flex justify-between text-white/90 font-medium"><span>Adjustments</span> <span>{formatCurrency(summary.totalAdjustments)}</span></div>}
                                        {(showTax ?? showTaxGlobal) && <div className="flex justify-between text-white/70"><span>Tax ({settings.taxPercentage}%)</span> <span>{formatCurrency(summary.taxAmount)}</span></div>}

                                        <div className="flex justify-between items-end pt-2">
                                            <span className="text-gold font-bold uppercase tracking-wider text-xs mb-1">Grand Total</span>
                                            <span className="text-2xl font-bold text-white">{formatCurrency(summary.grandTotal)}</span>
                                        </div>
                                        {depositPercentage && summary.depositAmount > 0 && (
                                            <div className="mt-3 bg-white/5 rounded p-2 text-center border border-white/5">
                                                <p className="text-[10px] text-gold-light uppercase font-bold">Deposit ({depositPercentage}%)</p>
                                                <p className="text-lg font-bold text-white">{formatCurrency(summary.depositAmount)}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-white/50 italic text-center py-4">Cost summary hidden.</p>
                                )}
                            </div>

                            {/* Bank Details */}
                            {settings.defaultBankDetails && (showBankDetails ?? true) && (
                                <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200 relative group z-10">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Info</h4>
                                    <pre className="whitespace-pre-wrap text-xs text-slate-700 font-sans leading-relaxed">{settings.defaultBankDetails}</pre>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Terms & Conditions */}
                    <section className="mt-auto pt-6 border-t border-gray-200 relative z-10">
                         <div className="flex justify-between items-center mb-1">
                             <h3 className="text-[10px] font-bold text-gray-500 uppercase">Terms & Conditions</h3>
                         </div>
                        {(showTerms ?? showTermsGlobal) ? (
                             <textarea
                                value={termsAndConditions || ''}
                                onChange={(e) => onUpdate({ ...data, termsAndConditions: e.target.value })}
                                rows={4}
                                className="w-full text-[11px] text-gray-600 bg-transparent border-none p-0 focus:ring-0 resize-none leading-relaxed"
                                placeholder="Enter terms..."
                            />
                        ) : <p className="text-[10px] text-gray-400 italic">Terms hidden.</p>}
                    </section>

                    {/* Footer */}
                    {settings.footerText && (
                        <div className="mt-6 text-center relative z-10">
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">{settings.footerText}</p>
                        </div>
                    )}

                    {companySignature && (
                     <div className="mt-8 flex justify-end relative z-10">
                         <div className="text-center">
                             <img src={companySignature} alt="Authorized Signature" className="h-12 object-contain mb-1 mx-auto" />
                             <div className="w-40 border-t border-slate-300"></div>
                             <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide font-medium">Authorized Signature</p>
                         </div>
                     </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full flex justify-center">
            {renderContent()}
        </div>
    )
};

export default QuotationDisplay;