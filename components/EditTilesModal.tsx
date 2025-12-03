
import React, { useState, useEffect } from 'react';
import { Tile, Settings } from '../types';
import { PlusIcon, RemoveIcon } from './icons';

interface EditTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tiles: Tile[]) => void;
  currentTiles: Tile[];
  settings: Settings;
}

// Local interface allowing strings for numeric fields to support typing decimals (e.g., "1.")
// Added 'addWastage' flag to local state
interface EditableTile extends Omit<Tile, 'sqm' | 'cartons' | 'unitPrice'> {
  sqm: string | number;
  cartons: string | number;
  unitPrice: string | number;
  addWastage?: boolean; 
}

const EditTilesModal: React.FC<EditTilesModalProps> = ({ isOpen, onClose, onSave, currentTiles, settings }) => {
  const [tiles, setTiles] = useState<EditableTile[]>([]);

  useEffect(() => {
    // Initialize local state when modal opens or tiles change
    setTiles(currentTiles.map(t => ({
        ...t,
        sqm: t.sqm,
        cartons: t.cartons,
        unitPrice: t.unitPrice,
        addWastage: false // Default to false to keep calculations strict unless user opts in
    })));
  }, [currentTiles, isOpen]);

  const getCoverageRate = (category: string) => {
    const cat = (category || '').toLowerCase().trim();
    const { 
        sittingRoomTileM2PerCarton, roomTileM2PerCarton, toiletWallTileM2PerCarton, 
        toiletFloorTileM2PerCarton, kitchenWallTileM2PerCarton, kitchenFloorTileM2PerCarton,
        externalWallTileM2PerCarton, stepTileM2PerCarton, wallTileM2PerCarton, floorTileM2PerCarton 
    } = settings;

    if (cat === 'sr' || cat === 'lr' || cat.includes('sitting') || cat.includes('living') || cat.includes('parlour') || cat.includes('dining')) return sittingRoomTileM2PerCarton;
    if (cat === 'br' || cat === 'mbr' || cat.includes('bedroom') || cat.includes('room') || cat.includes('guest') || cat.includes('store')) return roomTileM2PerCarton;
    
    if (cat === 'tw' || (cat.includes('toilet') && cat.includes('wall')) || (cat.includes('bathroom') && cat.includes('wall'))) return toiletWallTileM2PerCarton;
    if (cat === 'tf' || (cat.includes('toilet') && cat.includes('floor')) || (cat.includes('bathroom') && cat.includes('floor'))) return toiletFloorTileM2PerCarton;
    
    if (cat === 'kw' || (cat.includes('kitchen') && cat.includes('wall'))) return kitchenWallTileM2PerCarton;
    if (cat === 'kf' || (cat.includes('kitchen') && cat.includes('floor'))) return kitchenFloorTileM2PerCarton;
    
    if (cat === 'ext' || cat.includes('external') || cat.includes('outside') || cat.includes('facade')) return externalWallTileM2PerCarton;
    if (cat === 'step' || cat.includes('step') || cat.includes('stair')) return stepTileM2PerCarton;
    
    if (cat.includes('wall')) return wallTileM2PerCarton;
    
    return floorTileM2PerCarton; // Default fallback
  };

  const handleTileChange = (index: number, field: keyof EditableTile, value: string | number | boolean) => {
    const newTiles = [...tiles];
    const tile = { ...newTiles[index] };
    
    // Determine current rate based on potential category change
    const currentRate = getCoverageRate(field === 'category' ? (value as string) : (tile.category as string));
    const wastageFactor = settings.wastageFactor;

    // Update the field state directly first (except for addWastage which needs logic first)
    if (field !== 'addWastage') {
       (tile as any)[field] = value;
    }

    // --- Automatic Calculation Logic ---

    if (field === 'addWastage') {
        const isAdding = value as boolean;
        tile.addWastage = isAdding;
        
        const numSqm = typeof tile.sqm === 'string' ? parseFloat(tile.sqm) : tile.sqm;
        
        if (!isNaN(numSqm) && numSqm > 0) {
            // Transform the displayed SQM value
            let adjustedSqm = numSqm;
            if (isAdding) {
                // Apply wastage: Increase Net to Gross
                adjustedSqm = numSqm * wastageFactor;
            } else {
                // Remove wastage: Decrease Gross to Net
                adjustedSqm = numSqm / wastageFactor;
            }
            
            // Update SQM state with formatted value (2 decimals)
            tile.sqm = parseFloat(adjustedSqm.toFixed(2));
            
            // Recalculate Cartons based on new Effective SQM
            tile.cartons = Math.ceil(tile.sqm / currentRate);
        }
    } 
    else if (field === 'sqm' || field === 'category') {
        // If SQM or Category changes, calculate Cartons based on the current value in the SQM box.
        // We treat the number in the box as the "Effective SQM" required.
        const numSqm = typeof tile.sqm === 'string' ? parseFloat(tile.sqm) : tile.sqm;
        
        if (!isNaN(numSqm) && numSqm > 0) {
            tile.cartons = Math.ceil(numSqm / currentRate);
        } else if (field === 'sqm' && value === '') {
            tile.cartons = 0;
        }
    }
    else if (field === 'cartons') {
        // Reverse Calc: Cartons -> SQM
        // This SQM represents the total coverage of the cartons.
        const numCartons = typeof value === 'string' ? parseFloat(value) : (value as number);
        
        if (!isNaN(numCartons) && numCartons > 0) {
             tile.sqm = parseFloat((numCartons * currentRate).toFixed(2));
        } else if (value === '') {
            tile.sqm = 0;
        }
    }

    newTiles[index] = tile;
    setTiles(newTiles);
  };

  const handleAddTile = () => {
    setTiles([
      ...tiles,
      {
        category: '',
        group: 'General',
        cartons: 0,
        sqm: 0,
        tileType: 'Unknown',
        unitPrice: 0,
        size: '',
        addWastage: false
      },
    ]);
  };

  const handleRemoveTile = (index: number) => {
    setTiles(tiles.filter((_, i) => i !== index));
  };

  const handleSaveChanges = () => {
    // Convert back to strict number types for the app state
    const validatedTiles: Tile[] = tiles.map(tile => ({
        category: String(tile.category),
        group: tile.group ? String(tile.group) : 'General',
        size: tile.size ? String(tile.size) : undefined,
        tileType: tile.tileType as Tile['tileType'],
        // Ensure numeric values are actually numbers
        cartons: Math.max(0, Number(tile.cartons) || 0),
        sqm: Math.max(0, Number(tile.sqm) || 0),
        unitPrice: Math.max(0, Number(tile.unitPrice) || 0)
    }));
    onSave(validatedTiles);
  };

  if (!isOpen) return null;
  
  const inputClass = "mt-1 block w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-border-color dark:border-slate-700 rounded-lg shadow-sm sm:text-sm focus:ring-gold/80 focus:border-gold transition";

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-fade-in">
        <div className="p-8 border-b border-border-color dark:border-slate-700">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">Edit Tile Details</h2>
          <p className="text-sm text-gray-500">Modify, add, or remove tile entries. Calculations update automatically based on your settings.</p>
        </div>
        <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
          {tiles.map((tile, index) => (
            <div key={index} className="p-6 border border-border-color dark:border-slate-700 rounded-xl bg-brand-light dark:bg-slate-800 relative shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor={`category-${index}`} className="block text-xs font-bold text-brand-dark dark:text-slate-200 uppercase tracking-wide mb-1">Category</label>
                  <input
                    type="text"
                    id={`category-${index}`}
                    value={tile.category}
                    onChange={(e) => handleTileChange(index, 'category', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Kitchen Wall"
                  />
                </div>
                 <div className="md:col-span-2">
                  <label htmlFor={`group-${index}`} className="block text-xs font-bold text-brand-dark dark:text-slate-200 uppercase tracking-wide mb-1">Section / Group</label>
                  <input
                    type="text"
                    id={`group-${index}`}
                    value={tile.group || ''}
                    onChange={(e) => handleTileChange(index, 'group', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Flat 1, BQ, General"
                  />
                </div>
                <div>
                  <label htmlFor={`sqm-${index}`} className="block text-xs font-bold text-brand-dark dark:text-slate-200 uppercase tracking-wide mb-1">SQM (m²)</label>
                  <input
                    type="number"
                    id={`sqm-${index}`}
                    value={tile.sqm}
                    onChange={(e) => handleTileChange(index, 'sqm', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`cartons-${index}`} className="block text-xs font-bold text-brand-dark dark:text-slate-200 uppercase tracking-wide mb-1">Cartons</label>
                  <input
                    type="number"
                    id={`cartons-${index}`}
                    value={tile.cartons}
                    onChange={(e) => handleTileChange(index, 'cartons', e.target.value)}
                    className={inputClass}
                  />
                  <div className="flex items-center mt-2">
                    <input 
                        type="checkbox" 
                        id={`wastage-${index}`}
                        checked={tile.addWastage || false}
                        onChange={(e) => handleTileChange(index, 'addWastage', e.target.checked)}
                        className="h-3 w-3 rounded border-border-color text-gold focus:ring-gold"
                    />
                    <label htmlFor={`wastage-${index}`} className="ml-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-wide cursor-pointer select-none">Add Wastage ({Math.round((settings.wastageFactor - 1) * 100)}%)</label>
                  </div>
                </div>
                 <div>
                  <label htmlFor={`size-${index}`} className="block text-xs font-bold text-brand-dark dark:text-slate-200 uppercase tracking-wide mb-1">Size</label>
                  <input
                    type="text"
                    id={`size-${index}`}
                    value={tile.size || ''}
                    onChange={(e) => handleTileChange(index, 'size', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 60x60"
                  />
                </div>
                <div>
                  <label htmlFor={`unitPrice-${index}`} className="block text-xs font-bold text-brand-dark dark:text-slate-200 uppercase tracking-wide mb-1">Unit Price (NGN)</label>
                  <input
                    type="number"
                    id={`unitPrice-${index}`}
                    value={tile.unitPrice}
                    onChange={(e) => handleTileChange(index, 'unitPrice', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-4">
                  <label htmlFor={`tileType-${index}`} className="block text-xs font-bold text-brand-dark dark:text-slate-200 uppercase tracking-wide mb-1">Tile Type</label>
                  <select
                    id={`tileType-${index}`}
                    value={tile.tileType}
                    onChange={(e) => handleTileChange(index, 'tileType', e.target.value)}
                    className={inputClass}
                  >
                    <option>Wall</option>
                    <option>Floor</option>
                    <option>External Wall</option>
                    <option>Step</option>
                    <option>Unknown</option>
                  </select>
                </div>
              </div>
               <button
                  onClick={() => handleRemoveTile(index)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-danger hover:bg-red-100 rounded-full transition-colors"
                  aria-label="Remove tile"
                >
                  <RemoveIcon className="w-4 h-4" />
                </button>
            </div>
          ))}
           <button
            onClick={handleAddTile}
            className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 border-2 border-dashed border-border-color dark:border-slate-600 text-brand-dark dark:text-white font-semibold rounded-xl hover:border-gold hover:text-gold hover:bg-gold-light/10 transition-all"
           >
                <PlusIcon className="w-5 h-5" />
                Add New Tile Row
            </button>
        </div>
        <div className="p-6 bg-brand-light dark:bg-slate-900/50 border-t border-border-color dark:border-slate-700 flex justify-end gap-4 mt-auto rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-slate-700 text-brand-dark dark:text-white font-semibold rounded-lg border border-border-color dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark transition-all shadow-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTilesModal;
