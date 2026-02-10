import { useState } from 'react';
import { login } from '../services/api.js';

interface AuthScreenProps {
  onLogin: (jwt: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [token, setToken] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !deviceName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await login(token.trim(), deviceName.trim());
      onLogin(result.jwt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-400">RCCB</h1>
          <p className="text-gray-400 mt-2">Remote Claude Code Bridge</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              placeholder="Incolla il token di accesso"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome Dispositivo</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              placeholder="es. iPhone Pietro"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim() || !deviceName.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Connessione...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
