import React, { useState, useEffect, useRef } from 'react';
import { ClientDetails, Client } from '../types';
import { ChevronDownIcon } from './icons';

interface ClientDetailsFormProps {
  details: ClientDetails;
  setDetails: React.Dispatch<React.SetStateAction<ClientDetails>>;
  disabled: boolean;
  allClients: Client[];
  saveClientInfo: boolean;
  setSaveClientInfo: (save: boolean) => void;
}

const ClientDetailsForm: React.FC<ClientDetailsFormProps> = ({ details, setDetails, disabled, allClients, saveClientInfo, setSaveClientInfo }) => {
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        setDetails(prev => ({ ...prev, [name]: checked }));
    } else {
        setDetails(prev => ({ ...prev, [name]: value, clientId: undefined })); // Clear clientId if name is manually changed
         if (name === 'clientName' && value.length > 1) {
            const filtered = allClients.filter(client => 
                client.name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }
  };
  
  const handleSuggestionClick = (client: Client) => {
      setDetails(prev => ({
          ...prev,
          clientName: client.name,
          clientAddress: client.address,
          clientPhone: client.phone,
          clientId: client.id,
      }));
      setShowSuggestions(false);
  };
  
  const optionalFields = [
      { name: 'clientAddress', showName: 'showClientAddress', label: "Client's Address / Project Site", placeholder: "e.g., 123 Banana Island, Lagos" },
      { name: 'clientPhone', showName: 'showClientPhone', label: "Client's Phone", placeholder: "e.g., 08012345678" },
      { name: 'projectName', showName: 'showProjectName', label: "Project Name", placeholder: "e.g., Lekki Phase 1 Residence" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client Information</h2>
        <button onClick={() => setShowMore(!showMore)} className="text-xs font-semibold text-gold-dark hover:text-gold-darker flex items-center gap-1 px-2 py-1 rounded hover:bg-gold-light/20 transition">
          {showMore ? 'Less' : 'More'}
          <ChevronDownIcon className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Client Name with Autocomplete */}
        <div className="relative" ref={wrapperRef}>
            <div className="flex items-center justify-between mb-1.5">
                 <label htmlFor="clientName" className="block text-sm font-bold text-brand-dark dark:text-slate-200">
                    Client's Name
                </label>
                {showMore && (
                  <div className="flex items-center">
                      <input type="checkbox" id="showClientName" name="showClientName" checked={details.showClientName} onChange={handleChange} disabled={disabled} className="h-3.5 w-3.5 rounded border-gray-300 text-gold focus:ring-gold"/>
                      <label htmlFor="showClientName" className="ml-1.5 text-[10px] text-gray-400 font-medium uppercase">Show</label>
                  </div>
                )}
            </div>
            <input
                type="text"
                id="clientName"
                name="clientName"
                value={details.clientName}
                onChange={handleChange}
                onFocus={() => details.clientName.length > 1 && setShowSuggestions(true)}
                placeholder="Type Name..."
                disabled={disabled}
                autoComplete="off"
                className="block w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 sm:text-sm transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl max-h-40 overflow-auto animate-fade-in">
                    {suggestions.map(client => (
                        <li key={client.id} onClick={() => handleSuggestionClick(client)} className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                            <p className="font-bold text-sm text-brand-dark dark:text-white">{client.name}</p>
                            <p className="text-xs text-gray-400">{client.address}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        
        {/* Collapsible Section */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showMore ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pt-2 space-y-4">
            {optionalFields.map(field => (
                <div key={field.name}>
                    <div className="flex items-center justify-between mb-1.5">
                         <label htmlFor={field.name} className="block text-sm font-bold text-brand-dark dark:text-slate-200">
                            {field.label}
                        </label>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id={field.showName}
                                name={field.showName}
                                checked={details[field.showName as keyof ClientDetails] as boolean}
                                onChange={handleChange}
                                disabled={disabled}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-gold focus:ring-gold"
                            />
                            <label htmlFor={field.showName} className="ml-1.5 text-[10px] text-gray-400 font-medium uppercase">Show</label>
                        </div>
                    </div>
                    <input
                        type="text"
                        id={field.name}
                        name={field.name}
                        value={details[field.name as keyof ClientDetails] as string}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        disabled={disabled}
                        className="block w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 sm:text-sm transition-all"
                    />
                </div>
            ))}
          </div>
        </div>

        {!details.clientId && details.clientName.trim() && (
            <div className="flex items-center pt-2">
                 <input
                    type="checkbox"
                    id="saveClientInfo"
                    name="saveClientInfo"
                    checked={saveClientInfo}
                    onChange={(e) => setSaveClientInfo(e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                />
                <label htmlFor="saveClientInfo" className="ml-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Save to Client List</label>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailsForm;