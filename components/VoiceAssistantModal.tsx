import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, RemoveIcon } from './icons';

// Add types for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
}

const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Voice recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}. Please try again.`);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
      if(finalTranscript) {
          onCommand(finalTranscript);
      }
    };

    recognitionRef.current = recognition;
    
    // Auto-start listening when modal opens
    handleStartListening();

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isOpen, onCommand]);

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-brand-dark dark:text-white">Voice Assistant</h2>
                <p className="text-sm text-gray-500">Use your voice to control the app.</p>
            </div>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-danger hover:bg-red-100 rounded-full">
                <RemoveIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="p-8 text-center">
            <button 
                onClick={handleStartListening}
                disabled={isListening}
                className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-danger animate-pulse' : 'bg-gold hover:bg-gold-dark'}`}
            >
                <MicrophoneIcon className="w-12 h-12 text-white" />
            </button>
            <p className={`mt-6 text-lg font-medium h-8 ${isListening ? 'text-brand-dark dark:text-white' : 'text-gray-400'}`}>
                {isListening ? "Listening..." : "Click to start"}
            </p>
            <div className="mt-4 min-h-[5rem] bg-brand-light dark:bg-slate-800 p-4 rounded-lg border border-border-color dark:border-slate-700">
                <p className="text-brand-dark dark:text-slate-200 text-left">{transcript || "Your command will appear here..."}</p>
                 {error && <p className="text-danger text-sm mt-2">{error}</p>}
            </div>
            <div className="mt-4 text-xs text-gray-500 text-left">
                <p className="font-bold">Example Commands:</p>
                <ul className="list-disc list-inside">
                    <li>"Create quotation for Mr. John at Banana Island"</li>
                    <li>"Add 50 cartons of wall tiles"</li>
                    <li>"Go to dashboard"</li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;