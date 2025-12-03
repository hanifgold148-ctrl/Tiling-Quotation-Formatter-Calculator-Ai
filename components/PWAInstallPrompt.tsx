import React from 'react';
import { HanifgoldLogoIcon, UploadIcon, RemoveIcon } from './icons';

interface PWAInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-dark text-white p-4 shadow-lg animate-fade-in-up" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <HanifgoldLogoIcon className="w-12 h-10 hidden sm:block" />
          <div>
            <h3 id="pwa-install-title" className="font-bold text-lg">Install Hanifgold AI App</h3>
            <p className="text-sm text-gray-300">Get a faster, offline-ready experience on your device.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onInstall}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-brand-dark font-bold rounded-lg hover:bg-gold-dark transition shadow-md"
          >
            <UploadIcon className="w-5 h-5" />
            Install
          </button>
          <button
            onClick={onDismiss}
            className="p-2.5 text-gray-300 rounded-lg hover:bg-white/20 transition"
            aria-label="Dismiss install prompt"
          >
            <RemoveIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(100%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;