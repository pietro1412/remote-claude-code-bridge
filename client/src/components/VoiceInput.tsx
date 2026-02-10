import { useSpeech } from '../hooks/useSpeech.js';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } =
    useSpeech('it-IT');

  if (!isSupported) return null;

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        onTranscript(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <button
      onClick={handleToggle}
      title={isListening ? 'Stop registrazione' : 'Registra voce'}
      className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
        isListening
          ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
          : 'text-gray-400 hover:bg-gray-800'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  );
}
