
import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';
import { RemoveIcon, DatabaseIcon, DownloadCloudIcon, UploadCloudIcon } from './icons';
import SignaturePad from './SignaturePad';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onBackup?: () => void;
  onRestore?: (file: File) => void;
}

// Allow local state to hold strings for number fields to support decimal typing (e.g., "1.")
type EditableSettings = {
  [K in keyof Settings]: Settings[K] extends number ? string | number : Settings[K];
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onBackup, onRestore }) => {
  const [localSettings, setLocalSettings] = useState<EditableSettings>(settings);
  const [newUnit, setNewUnit] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [signatureTab, setSignatureTab] = useState<'draw' | 'upload'>('draw');
  
  // New state for size pricing
  const [newSize, setNewSize] = useState('');
  const [newSizePrice, setNewSizePrice] = useState<number | ''>('');

  // Local state for wastage percentage (derived from factor)
  const [wastagePercent, setWastagePercent] = useState<string | number>('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync local state when settings prop changes or modal opens
    setLocalSettings(settings);
    // Convert factor (e.g., 1.10) to percentage (e.g., 10)
    const percent = Math.round((settings.wastageFactor - 1) * 100);
    setWastagePercent(percent);
  }, [settings, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    setLocalSettings(prev => ({
      ...prev,
      // Keep numeric values as strings during editing to allow "1."
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleWastageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setWastagePercent(val);
      // Update local settings immediately with the factor
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
          const factor = 1 + (numVal / 100);
          setLocalSettings(prev => ({ ...prev, wastageFactor: factor }));
      }
  };
  
  const handleAddUnit = () => {
    if (newUnit.trim() && !localSettings.customMaterialUnits.includes(newUnit.trim().toLowerCase())) {
        setLocalSettings(prev => ({
            ...prev,
            customMaterialUnits: [...prev.customMaterialUnits, newUnit.trim().toLowerCase()]
        }));
        setNewUnit('');
    }
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    setLocalSettings(prev => ({
        ...prev,
        customMaterialUnits: prev.customMaterialUnits.filter(u => u !== unitToRemove)
    }));
  };

  const handleAddExpenseCategory = () => {
    if (newExpenseCategory.trim() && !localSettings.defaultExpenseCategories.includes(newExpenseCategory.trim())) {
        setLocalSettings(prev => ({
            ...prev,
            defaultExpenseCategories: [...prev.defaultExpenseCategories, newExpenseCategory.trim()]
        }));
        setNewExpenseCategory('');
    }
  };

  const handleRemoveExpenseCategory = (categoryToRemove: string) => {
    setLocalSettings(prev => ({
        ...prev,
        defaultExpenseCategories: prev.defaultExpenseCategories.filter(c => c !== categoryToRemove)
    }));
  };

  const handleAddSizePrice = () => {
      if (newSize.trim() && typeof newSizePrice === 'number') {
          setLocalSettings(prev => ({
              ...prev,
              tilePricesBySize: [...(prev.tilePricesBySize || []), { size: newSize.trim(), price: newSizePrice }]
          }));
          setNewSize('');
          setNewSizePrice('');
      }
  }

  const handleRemoveSizePrice = (index: number) => {
      setLocalSettings(prev => ({
          ...prev,
          tilePricesBySize: (prev.tilePricesBySize || []).filter((_, i) => i !== index)
      }));
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, companyLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, companySignature: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSignatureDrawSave = (base64: string) => {
      setLocalSettings(prev => ({ ...prev, companySignature: base64 }));
  };
  
  const handleRestoreFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onRestore) {
          if (window.confirm("WARNING: Restoring data will overwrite your current quotations, invoices, and clients. Are you sure you want to proceed?")) {
              onRestore(file);
          }
      }
      if (restoreInputRef.current) restoreInputRef.current.value = '';
  };


  const handleSave = () => {
    // Convert string inputs back to numbers before saving
    const finalSettings: Settings = { ...localSettings } as Settings;
    
    // Iterate keys to ensure numbers are numbers
    (Object.keys(finalSettings) as Array<keyof Settings>).forEach(key => {
        const val = localSettings[key];
        if (typeof settings[key] === 'number' && typeof val === 'string') {
             (finalSettings as any)[key] = val === '' ? 0 : Number(val);
        }
    });
    
    onSave(finalSettings);
    onClose();
  };
  
  if (!isOpen) return null;

  const renderSection = (title: string, description: string, children: React.ReactNode) => (
    <div className="py-8 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-border-color dark:border-slate-700 last:border-0">
      <div className="sm:col-span-1">
        <h3 className="text-lg font-bold text-brand-dark dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="mt-4 sm:mt-0 sm:col-span-2 space-y-6">
        {children}
      </div>
    </div>
  );
  
  const renderInput = (name: keyof Settings, label: string, type: string = 'number', step?: string, placeholder?: string) => (
    <div>
      <label htmlFor={name} className="block text-sm font-bold text-brand-dark dark:text-slate-200">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={localSettings[name] as any}
        onChange={handleChange}
        step={step}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition"
      />
    </div>
  );
  
  const renderCheckbox = (name: keyof Settings, label: string) => (
      <div className="flex items-center">
        <input
            type="checkbox"
            id={name}
            name={name}
            checked={localSettings[name] as boolean}
            onChange={handleChange}
            className="h-4 w-4 rounded border-border-color text-gold focus:ring-gold"
        />
        <label htmlFor={name} className="ml-3 block text-sm font-medium text-brand-dark dark:text-slate-200">{label}</label>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">Application Settings</h2>
                <p className="text-sm text-gray-500">Customize calculations, display options, and company information.</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-danger hover:bg-red-100 rounded-full">
                <RemoveIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="p-8 overflow-y-auto">
          
          {renderSection('Company Information', 'Set your company details for quotations.',
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('companyName', 'Company Name', 'text')}
              {renderInput('companySlogan', 'Company Slogan', 'text')}
              {renderInput('companyAddress', 'Company Address', 'text')}
              {renderInput('companyEmail', 'Company Email', 'email')}
              {renderInput('companyPhone', 'Company Phone', 'tel')}
            </div>
          )}

          {renderSection('Category & Material Base Prices', 'Set the default unit prices and wastage settings.',
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2"><h4 className="text-sm font-bold text-gold-darker uppercase tracking-wide mb-2">Common Areas</h4></div>
                {renderInput('sittingRoomTilePrice', 'Sitting Room / Living Room (NGN)', 'number', '100')}
                {renderInput('bedroomTilePrice', 'Bedroom / General Room (NGN)', 'number', '100')}
                {renderInput('floorTilePrice', 'General Floor (NGN)', 'number', '100')}
                {renderInput('wallTilePrice', 'General Wall (NGN)', 'number', '100')}
                
                <div className="sm:col-span-2 border-t border-border-color dark:border-slate-700 my-1"></div>
                <div className="sm:col-span-2"><h4 className="text-sm font-bold text-gold-darker uppercase tracking-wide mb-2">Specific Areas</h4></div>
                
                {renderInput('toiletWallTilePrice', 'Toilet Wall (NGN)', 'number', '100')}
                {renderInput('toiletFloorTilePrice', 'Toilet Floor (NGN)', 'number', '100')}
                {renderInput('kitchenWallTilePrice', 'Kitchen Wall (NGN)', 'number', '100')}
                {renderInput('kitchenFloorTilePrice', 'Kitchen Floor (NGN)', 'number', '100')}
                {renderInput('externalWallTilePrice', 'External Wall (NGN)', 'number', '100')}
                {renderInput('stepTilePrice', 'Step / Staircase (NGN)', 'number', '100')}

                <div className="sm:col-span-2 border-t border-border-color dark:border-slate-700 my-1"></div>
                <div className="sm:col-span-2"><h4 className="text-sm font-bold text-gold-darker uppercase tracking-wide mb-2">Materials & Labor</h4></div>

                {renderInput('cementPrice', 'Cement Price (per bag) (NGN)', 'number', '100')}
                {renderInput('whiteCementPrice', 'White Cement Price (per bag) (NGN)', 'number', '100')}
                {renderInput('sharpSandPrice', 'Sharp Sand Price (NGN)', 'number', '100')}
                {renderInput('workmanshipRate', 'Workmanship Rate (per m²) (NGN)', 'number', '100')}

                <div className="sm:col-span-2 border-t border-border-color dark:border-slate-700 my-1"></div>
                <div className="sm:col-span-2 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <label htmlFor="wastagePercent" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Wastage Buffer (%)</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">This percentage can be optionally added to calculations in the editor.</p>
                    <input
                        type="number"
                        id="wastagePercent"
                        value={wastagePercent}
                        onChange={handleWastageChange}
                        placeholder="e.g., 10"
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition"
                    />
                </div>
            </div>
          )}

          {renderSection('Default Tile Sizes', 'Define the default tile size (e.g., 25x40, 40x40) to automatically apply for each area if you do not specify one in your notes.',
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border-color dark:border-slate-700">
                {renderInput('defaultToiletWallSize', 'Toilet Wall Size', 'text', undefined, 'e.g. 25x40')}
                {renderInput('defaultToiletFloorSize', 'Toilet Floor Size', 'text', undefined, 'e.g. 40x40')}
                {renderInput('defaultKitchenWallSize', 'Kitchen Wall Size', 'text', undefined, 'e.g. 25x40')}
                {renderInput('defaultKitchenFloorSize', 'Kitchen Floor Size', 'text', undefined, 'e.g. 40x40')}
                {renderInput('defaultRoomFloorSize', 'Bedroom/Room Size', 'text', undefined, 'e.g. 40x40')}
                {renderInput('defaultSittingRoomSize', 'Sitting Room Size', 'text', undefined, 'e.g. 60x60')}
            </div>
          )}

          {renderSection('Size-Based Pricing Rules', 'Set specific prices for different tile sizes. These prices override category defaults if a size is detected in the notes.',
            <div>
                <div className="flex gap-2 mb-3 items-end">
                    <div className="flex-grow">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Size (e.g. 60x60)</label>
                        <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} className="w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm sm:text-sm" placeholder="e.g. 30x60"/>
                    </div>
                     <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Price (NGN)</label>
                        <input type="number" value={newSizePrice} onChange={(e) => setNewSizePrice(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm sm:text-sm" placeholder="0"/>
                    </div>
                    <button onClick={handleAddSizePrice} disabled={!newSize.trim() || newSizePrice === ''} className="px-4 py-2 bg-gold text-brand-dark font-bold rounded-lg disabled:opacity-50 mb-[1px]">Add</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-border-color dark:border-slate-700 rounded-lg p-2 bg-gray-50 dark:bg-slate-800/50">
                    {(localSettings.tilePricesBySize || []).map((rule, index) => (
                        <div key={index} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700 shadow-sm">
                            <span className="font-mono text-sm text-brand-dark dark:text-slate-200 font-semibold">{rule.size}</span>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-sm text-gold-dark">N{rule.price.toLocaleString()}</span>
                                <button onClick={() => handleRemoveSizePrice(index)} className="text-gray-400 hover:text-red-500"><RemoveIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                    {(!localSettings.tilePricesBySize || localSettings.tilePricesBySize.length === 0) && <p className="text-xs text-gray-400 italic text-center py-2">No size-based rules configured.</p>}
                </div>
            </div>
          )}

          {renderSection('Tile Coverage Configuration', 'Define the square meters (m²) contained in ONE carton for different areas.',
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border-color dark:border-slate-700">
                {renderInput('sittingRoomTileM2PerCarton', 'Sitting Room Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('roomTileM2PerCarton', 'Room / Bedroom Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('toiletWallTileM2PerCarton', 'Toilet Wall Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('toiletFloorTileM2PerCarton', 'Toilet Floor Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('kitchenWallTileM2PerCarton', 'Kitchen Wall Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('kitchenFloorTileM2PerCarton', 'Kitchen Floor Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('wallTileM2PerCarton', 'General Wall Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('floorTileM2PerCarton', 'General Floor Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('externalWallTileM2PerCarton', 'External Wall Coverage (m²/carton)', 'number', '0.01')}
                {renderInput('stepTileM2PerCarton', 'Step / Staircase Coverage (m²/carton)', 'number', '0.01')}
            </div>
          )}

          {renderSection('Letterhead & Branding', 'Design a professional header and footer for all exported documents.',
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-brand-dark dark:text-slate-200 mb-2">Company Logo</label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-brand-light dark:bg-slate-800 rounded-lg border flex items-center justify-center overflow-hidden">
                            {localSettings.companyLogo ? <img src={localSettings.companyLogo} alt="Company Logo" className="max-w-full max-h-full object-contain"/> : <span className="text-xs text-gray-400">No Logo</span>}
                        </div>
                        <div className="space-y-2">
                           <button type="button" onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 text-sm">Upload Logo</button>
                           <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                           {localSettings.companyLogo && <button type="button" onClick={() => setLocalSettings(p => ({...p, companyLogo: ''}))} className="text-sm text-red-600 hover:underline">Remove</button>}
                        </div>
                    </div>
                </div>
                 <div>
                    <label htmlFor="accentColor" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Accent Color</label>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="color" id="accentColor" name="accentColor" value={localSettings.accentColor as string} onChange={handleChange} className="w-10 h-10 p-1 border-none rounded-lg cursor-pointer" />
                        <span className="font-mono text-sm text-gray-600 dark:text-slate-400">{localSettings.accentColor}</span>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-brand-dark dark:text-slate-200 mb-2">Header Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['modern', 'classic', 'minimalist'] as const).map(layout => (
                           <label key={layout} className={`block p-2 border-2 rounded-lg cursor-pointer text-center ${localSettings.headerLayout === layout ? 'border-gold bg-gold-light/20 text-gold-dark' : 'border-border-color dark:border-slate-700 text-gray-500'}`}>
                               <input type="radio" name="headerLayout" value={layout} checked={localSettings.headerLayout === layout} onChange={handleChange} className="sr-only" />
                               <span className="text-sm font-semibold capitalize">{layout}</span>
                           </label>
                        ))}
                    </div>
                 </div>
                  <div>
                    <label htmlFor="documentTitle" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Document Title</label>
                    <input type="text" id="documentTitle" name="documentTitle" value={localSettings.documentTitle as string} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition" />
                 </div>
                 <div>
                    <label htmlFor="footerText" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Footer Text</label>
                    <input type="text" id="footerText" name="footerText" value={localSettings.footerText as string} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition" />
                 </div>
            </div>
          )}
          
          {renderSection('Digital Signature', 'Add a signature to be displayed at the bottom of your invoices.',
              <div className="space-y-4">
                  <div className="flex gap-4 border-b border-border-color dark:border-slate-700">
                      <button 
                          onClick={() => setSignatureTab('draw')}
                          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${signatureTab === 'draw' ? 'border-gold text-gold-dark' : 'border-transparent text-gray-500 hover:text-brand-dark'}`}
                      >
                          Draw Signature
                      </button>
                       <button 
                          onClick={() => setSignatureTab('upload')}
                          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${signatureTab === 'upload' ? 'border-gold text-gold-dark' : 'border-transparent text-gray-500 hover:text-brand-dark'}`}
                      >
                          Upload Image
                      </button>
                  </div>
                  
                  {signatureTab === 'draw' ? (
                      <SignaturePad onSave={handleSignatureDrawSave} onClear={() => setLocalSettings(p => ({...p, companySignature: ''}))} existingSignature={localSettings.companySignature}/>
                  ) : (
                       <div className="flex items-center gap-4">
                        <div className="w-32 h-20 bg-brand-light dark:bg-slate-800 rounded-lg border flex items-center justify-center overflow-hidden">
                            {localSettings.companySignature ? <img src={localSettings.companySignature} alt="Signature" className="max-w-full max-h-full object-contain"/> : <span className="text-xs text-gray-400">No Signature</span>}
                        </div>
                        <div className="space-y-2">
                           <button type="button" onClick={() => signatureInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 text-sm">
                               <UploadCloudIcon className="w-4 h-4"/> Upload
                           </button>
                           <input ref={signatureInputRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                           {localSettings.companySignature && <button type="button" onClick={() => setLocalSettings(p => ({...p, companySignature: ''}))} className="text-sm text-red-600 hover:underline">Remove</button>}
                        </div>
                    </div>
                  )}
                  
                  {localSettings.companySignature && signatureTab === 'draw' && (
                       <div className="mt-4">
                            <p className="text-xs font-bold text-gray-500 mb-1">Current Signature Preview:</p>
                             <div className="w-40 h-20 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center">
                                 <img src={localSettings.companySignature} alt="Saved Signature" className="max-w-full max-h-full" />
                             </div>
                       </div>
                  )}
              </div>
          )}

          {renderSection('Display Options', 'Control which fields appear on your quotations and exports.',
            <div className="space-y-4">
               {renderCheckbox('showUnitPrice', 'Show Unit Price')}
               {renderCheckbox('showSubtotal', 'Show Subtotal')}
               {renderCheckbox('showMaintenance', 'Show Maintenance Fee')}
               {renderCheckbox('showTileSize', 'Show Tile Size')}
               {renderCheckbox('showTax', 'Show Tax')}
               {renderCheckbox('showChecklistDefault', 'Enable Checklist by Default')}
               {renderCheckbox('addCheckmateDefault', 'Add "Checkmate" item by Default')}
               {renderCheckbox('showTermsAndConditions', 'Show Terms & Conditions')}
               {renderCheckbox('showMaterialsDefault', 'Show Other Materials section on new quotations')}
               {renderCheckbox('showAdjustmentsDefault', 'Show Discounts & Adjustments section on new quotations')}
            </div>
          )}

          {renderSection('Invoicing', 'Configure default settings for invoices.',
            <div className="space-y-6">
                {renderInput('invoicePrefix', 'Invoice Prefix (e.g. INV)', 'text')}
                <div>
                    <label htmlFor="defaultBankDetails" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Default Bank Details</label>
                    <textarea id="defaultBankDetails" name="defaultBankDetails" value={localSettings.defaultBankDetails as string} onChange={handleChange} rows={4} className="mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition" />
                </div>
                 <div>
                    <label htmlFor="defaultInvoiceNotes" className="block text-sm font-bold text-brand-dark dark:text-slate-200">Default Invoice Notes</label>
                    <textarea id="defaultInvoiceNotes" name="defaultInvoiceNotes" value={localSettings.defaultInvoiceNotes as string} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/80 focus:border-gold sm:text-sm transition" />
                </div>
                 {renderCheckbox('showDeposit', 'Show Deposit field on Quotes')}
                 {renderInput('defaultDepositPercentage', 'Default Deposit %', 'number', '1')}
                 {renderCheckbox('showQRCode', 'Show Payment QR Code on Invoice')}
                 {localSettings.showQRCode && renderInput('paymentUrl', 'Payment URL or Account String', 'text', undefined, 'e.g., bank transfer link or UPI ID')}
            </div>
          )}

           {renderSection('Customization', 'Manage lists for dropdowns.',
             <div className="space-y-6">
                <div>
                     <label className="block text-sm font-bold text-brand-dark dark:text-slate-200 mb-2">Material Units</label>
                     <div className="flex gap-2 mb-2">
                         <input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="New unit (e.g. bundles)" className="flex-grow px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm sm:text-sm"/>
                         <button onClick={handleAddUnit} disabled={!newUnit.trim()} className="px-4 py-2 bg-gold text-brand-dark font-bold rounded-lg disabled:opacity-50">Add</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {localSettings.customMaterialUnits.map(unit => (
                             <span key={unit} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                                 {unit}
                                 <button onClick={() => handleRemoveUnit(unit)} className="ml-2 text-gray-500 hover:text-red-600"><RemoveIcon className="w-3 h-3"/></button>
                             </span>
                         ))}
                     </div>
                </div>
                 <div>
                     <label className="block text-sm font-bold text-brand-dark dark:text-slate-200 mb-2">Expense Categories</label>
                     <div className="flex gap-2 mb-2">
                         <input type="text" value={newExpenseCategory} onChange={(e) => setNewExpenseCategory(e.target.value)} placeholder="New category" className="flex-grow px-3 py-2 bg-brand-light dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm sm:text-sm"/>
                         <button onClick={handleAddExpenseCategory} disabled={!newExpenseCategory.trim()} className="px-4 py-2 bg-gold text-brand-dark font-bold rounded-lg disabled:opacity-50">Add</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {localSettings.defaultExpenseCategories.map(cat => (
                             <span key={cat} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                                 {cat}
                                 <button onClick={() => handleRemoveExpenseCategory(cat)} className="ml-2 text-indigo-400 hover:text-indigo-600"><RemoveIcon className="w-3 h-3"/></button>
                             </span>
                         ))}
                     </div>
                </div>
             </div>
          )}

          {renderSection('Data Management', 'Backup or restore your application data.',
             <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={onBackup} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                     <DownloadCloudIcon className="w-5 h-5"/>
                     Backup Data
                 </button>
                 <div className="relative">
                     <button onClick={() => restoreInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition w-full">
                        <UploadCloudIcon className="w-5 h-5"/>
                        Restore Data
                     </button>
                     <input 
                        ref={restoreInputRef}
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={handleRestoreFileChange}
                     />
                 </div>
                 <div className="text-xs text-gray-500 mt-2 sm:mt-0 flex items-center">
                     <DatabaseIcon className="w-4 h-4 mr-1"/>
                     <span>Safe .json format</span>
                 </div>
             </div>
          )}

        </div>
        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t border-border-color dark:border-slate-700 flex justify-end gap-4 mt-auto">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all shadow-sm">Cancel</button>
          <button type="button" onClick={handleSave} className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark transition-all shadow-md">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
