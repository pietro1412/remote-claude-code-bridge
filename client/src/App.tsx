import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useSocket } from './hooks/useSocket.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useTheme } from './hooks/useTheme.js';
import AuthScreen from './components/AuthScreen.js';
import StatusBar from './components/StatusBar.js';
import TerminalComponent from './components/Terminal.js';
import InputBar from './components/InputBar.js';
import VoiceInput from './components/VoiceInput.js';
import PhotoUpload from './components/PhotoUpload.js';
import SessionList from './components/SessionList.js';

export default function App() {
  const { jwt, isAuthenticated, saveToken, logout } = useAuth();
  const {
    connected,
    sessions,
    activeStatus,
    sendInput,
    approve,
    reject,
    interrupt,
    createSession,
    killSession,
    sendPhoto,
    onOutput,
  } = useSocket(jwt);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const { theme, toggle: toggleTheme } = useTheme();
  const { requestPermission } = useNotifications(activeStatus, activeSession?.name ?? null);

  // Request notification permission on first interaction
  useEffect(() => {
    const handler = () => {
      requestPermission();
      window.removeEventListener('click', handler);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [requestPermission]);

  // Auto-select first session if none selected
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  const handleSend = useCallback(
    (text: string) => {
      if (!activeSessionId) return;
      sendInput(activeSessionId, text);
    },
    [activeSessionId, sendInput],
  );

  const handleApprove = useCallback(() => {
    if (activeSessionId) approve(activeSessionId);
  }, [activeSessionId, approve]);

  const handleReject = useCallback(() => {
    if (activeSessionId) reject(activeSessionId);
  }, [activeSessionId, reject]);

  const handleInterrupt = useCallback(() => {
    if (activeSessionId) interrupt(activeSessionId);
  }, [activeSessionId, interrupt]);

  const handlePhotoUpload = useCallback(
    (filename: string, base64: string) => {
      if (activeSessionId) sendPhoto(activeSessionId, filename, base64);
    },
    [activeSessionId, sendPhoto],
  );

  if (!isAuthenticated) {
    return <AuthScreen onLogin={saveToken} />;
  }

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      <StatusBar
        connected={connected}
        activeSession={activeSession}
        status={activeStatus}
        onOpenSessions={() => setShowSessions(true)}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <TerminalComponent onOutput={onOutput} activeSessionId={activeSessionId} theme={theme} />

      <div className={`flex items-center gap-1 px-3 pb-0 pt-1 border-t ${
        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'
      }`}>
        <VoiceInput onTranscript={setVoiceText} />
        <PhotoUpload
          onUpload={handlePhotoUpload}
          disabled={!activeSessionId}
        />
      </div>

      <InputBar
        onSend={handleSend}
        onApprove={handleApprove}
        onReject={handleReject}
        onInterrupt={handleInterrupt}
        showApproval={activeStatus === 'approval_needed'}
        disabled={!activeSessionId || !connected}
        voiceText={voiceText}
        onVoiceClear={() => setVoiceText('')}
        theme={theme}
      />

      {showSessions && (
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActiveSessionId}
          onCreate={createSession}
          onKill={killSession}
          onClose={() => setShowSessions(false)}
          theme={theme}
        />
      )}
    </div>
  );
}
