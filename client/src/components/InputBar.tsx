import { useState, useRef, useEffect } from 'react';

interface InputBarProps {
  onSend: (text: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onInterrupt: () => void;
  showApproval: boolean;
  disabled: boolean;
  voiceText?: string;
  onVoiceClear?: () => void;
  theme: 'dark' | 'light';
}

export default function InputBar({
  onSend,
  onApprove,
  onReject,
  onInterrupt,
  showApproval,
  disabled,
  voiceText,
  onVoiceClear,
  theme,
}: InputBarProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (voiceText) {
      setText((prev) => prev + voiceText);
      onVoiceClear?.();
    }
  }, [voiceText, onVoiceClear]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`border-t p-3 safe-area-bottom ${
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'
    }`}>
      {showApproval && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={onApprove}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Approva
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Rifiuta
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio..."
          disabled={disabled}
          rows={1}
          className={`flex-1 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:border-indigo-500 min-h-[44px] max-h-[120px] ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          }`}
          style={{ overflow: 'auto' }}
        />

        <button
          onClick={onInterrupt}
          title="Ctrl+C"
          className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isDark ? 'text-yellow-400 hover:bg-gray-800' : 'text-yellow-600 hover:bg-gray-200'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
        </button>

        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
