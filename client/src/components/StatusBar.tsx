import type { ClaudeCodeStatus, SessionRecord } from '../types/events.js';

interface StatusBarProps {
  connected: boolean;
  activeSession: SessionRecord | null;
  status: ClaudeCodeStatus | null;
  onOpenSessions: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const statusLabels: Record<ClaudeCodeStatus, string> = {
  idle: 'Inattivo',
  waiting_input: 'In attesa di input',
  thinking: 'Elaborazione...',
  executing: 'Esecuzione...',
  approval_needed: 'Richiesta approvazione',
};

export default function StatusBar({
  connected,
  activeSession,
  status,
  onOpenSessions,
  onLogout,
  theme,
  onToggleTheme,
}: StatusBarProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b safe-area-top ${
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          title={connected ? 'Connesso' : 'Disconnesso'}
        />
        <button
          onClick={onOpenSessions}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors truncate"
        >
          {activeSession ? activeSession.name : 'RCCB'}
        </button>
        {status && (
          <span className={`text-xs flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            {statusLabels[status]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {activeSession && (
          <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            ${activeSession.total_cost.toFixed(2)}
          </span>
        )}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className={`p-1 rounded transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        <button
          onClick={onLogout}
          className={`text-xs transition-colors ${isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-600 hover:text-red-500'}`}
        >
          Esci
        </button>
      </div>
    </div>
  );
}
