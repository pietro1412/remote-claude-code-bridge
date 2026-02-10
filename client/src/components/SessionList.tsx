import { useState } from 'react';
import type { SessionRecord } from '../types/events.js';

interface SessionListProps {
  sessions: SessionRecord[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, cwd: string) => void;
  onKill: (id: string) => void;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export default function SessionList({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onKill,
  onClose,
  theme,
}: SessionListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [cwd, setCwd] = useState('');
  const isDark = theme === 'dark';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cwd.trim()) return;
    onCreate(name.trim(), cwd.trim());
    setName('');
    setCwd('');
    setShowCreate(false);
  };

  return (
    <div className={`fixed inset-0 z-40 flex flex-col ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-300'
      }`}>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Sessioni
        </h2>
        <button
          onClick={onClose}
          className={`p-2 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => { onSelect(session.id); onClose(); }}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              session.id === activeSessionId
                ? 'border-indigo-500 bg-indigo-500/10'
                : isDark
                  ? 'border-gray-800 hover:border-gray-700 bg-gray-900'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    session.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                />
                <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {session.name}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onKill(session.id); }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Termina
              </button>
            </div>
            <p className={`text-sm mt-1 font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              {session.cwd}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              {session.status === 'active' ? 'Attiva' : 'In pausa'} — ${session.total_cost.toFixed(2)}
            </p>
          </div>
        ))}

        {sessions.length === 0 && (
          <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Nessuna sessione attiva
          </p>
        )}
      </div>

      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
        {showCreate ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome sessione"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 ${
                isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
              autoFocus
            />
            <input
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="Directory di lavoro (es. /home/user/progetto)"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm ${
                isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!name.trim() || !cwd.trim()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Crea
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Annulla
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className={`w-full py-3 border border-dashed rounded-lg transition-colors ${
              isDark
                ? 'border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400'
                : 'border-gray-400 text-gray-500 hover:border-indigo-500 hover:text-indigo-600'
            }`}
          >
            + Nuova Sessione
          </button>
        )}
      </div>
    </div>
  );
}
