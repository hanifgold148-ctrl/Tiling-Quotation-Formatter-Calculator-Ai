import React, { useRef, useState, KeyboardEvent } from 'react';
import { EXAMPLE_INPUT } from '../constants';
import { UploadIcon, RemoveIcon, MicrophoneIcon, BulkGenerateIcon, PlusIcon, UndoIcon, RedoIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface InputSectionProps {
  notes: string[];
  setNotes: (notes: string[] | ((prev: string[]) => string[])) => void;
  disabled: boolean;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
  imagePreview: string | null;
  isOcrLoading: boolean;
  onOpenVoiceModal: () => void;
  onOpenBulkModal: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ 
  notes, setNotes, disabled,
  onImageUpload, onRemoveImage, imagePreview, isOcrLoading,
  onOpenVoiceModal, onOpenBulkModal,
  onUndo, onRedo, canUndo, canRedo
}) => {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentNote, setCurrentNote] = useState('');
 
  const handleUseExample = () => {
    onRemoveImage();
    setNotes(EXAMPLE_INPUT.split('\n').filter(n => n.trim() !== ''));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleAddNote = () => {
    if (currentNote.trim()) {
      setNotes(prev => [...prev, currentNote.trim()]);
      setCurrentNote('');
    }
  };

  const handleRemoveNote = (indexToRemove: number) => {
    setNotes(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Job Notes
        </h2>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 rounded-lg p-1">
             <button type="button" onClick={onUndo} disabled={disabled || !canUndo} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-brand-dark disabled:opacity-30 transition-all shadow-sm"><UndoIcon className="w-3.5 h-3.5" /></button>
             <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
             <button type="button" onClick={onRedo} disabled={disabled || !canRedo} className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-brand-dark disabled:opacity-30 transition-all shadow-sm"><RedoIcon className="w-3.5 h-3.5" /></button>
          </div>
           <button onClick={onOpenBulkModal} disabled={disabled} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors" title="Bulk Generate"><BulkGenerateIcon className="w-4 h-4" /></button>
           <button onClick={onOpenVoiceModal} disabled={disabled} className="p-2 rounded-lg bg-gold-light text-gold-dark hover:bg-gold/20 disabled:opacity-50 transition-colors" title="Voice Input"><MicrophoneIcon className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-4">
        {notes.length > 0 && (
            <div className="p-2 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                {notes.map((note, index) => (
                    <div key={index} className="flex items-start justify-between text-sm text-slate-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border-l-4 border-gold group transition-all hover:shadow-sm">
                        <span className="flex-grow leading-relaxed font-medium">{note}</span>
                        <button onClick={() => handleRemoveNote(index)} disabled={disabled} className="ml-3 text-gray-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                            <RemoveIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        )}
         <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-3.5 pr-20 border-none rounded-xl bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-gold/30 transition-all text-sm shadow-inner placeholder-gray-400"
              placeholder="Type notes here (e.g. Flat 1: TW 60m2...)"
              value={currentNote}
              onChange={(e) => {
                if (imagePreview) onRemoveImage();
                setCurrentNote(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
             <button
                onClick={handleAddNote}
                disabled={disabled || !currentNote.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-dark text-white text-xs font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50 shadow-md"
              >
                Add
              </button>
         </div>

         {/* Short Codes Legend */}
         <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            {['TW', 'TF', 'KW', 'KF', 'SR', 'MBR', 'PASS'].map(code => (
                <span key={code} className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">{code}</span>
            ))}
         </div>

         {isOcrLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
              <LoadingSpinner />
              <p className="mt-3 text-brand-dark dark:text-white font-medium text-sm">Processing image...</p>
          </div>
        )}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-100 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-slate-900 px-3 text-xs font-bold text-gray-300 uppercase tracking-widest">OR</span>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/30 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:border-gold hover:bg-gold-light/5 transition-all min-h-[8rem] cursor-pointer group relative overflow-hidden" onClick={!imagePreview ? handleUploadClick : undefined}>
          {imagePreview ? (
             <div className="relative w-full flex justify-center group-hover:scale-[1.02] transition-transform duration-500">
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                   <span className="text-white text-xs font-bold">Change Image</span>
              </div>
              <img src={imagePreview} alt="Tiling notes preview" className="rounded-lg shadow-lg max-h-40 object-contain" />
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveImage(); }}
                disabled={disabled}
                className="absolute -top-2 -right-2 bg-white text-danger rounded-full p-1.5 shadow-xl hover:bg-red-50 border border-gray-100 z-20"
                aria-label="Remove image"
              >
                <RemoveIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
             <div className="text-center w-full">
                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <UploadIcon className="h-5 w-5 text-gray-400 group-hover:text-gold transition-colors" />
                </div>
                <p className="text-sm text-brand-dark dark:text-slate-300 font-bold">Upload handwritten notes</p>
                <p className="text-xs text-gray-400 mt-1">Supports images containing text</p>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={disabled} />
             </div>
          )}
      </div>
      
      <div className="mt-4 text-center">
           <button type="button" onClick={handleUseExample} className="text-xs text-gold-dark font-bold uppercase tracking-wide hover:text-brand-dark transition-colors disabled:opacity-50" disabled={disabled}>
            Load example data
          </button>
      </div>
    </div>
  );
};

export default InputSection;