import { useState, useCallback, useEffect } from 'react';

const JWT_KEY = 'rccb_jwt';

export function useAuth() {
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem(JWT_KEY));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(JWT_KEY));

  useEffect(() => {
    setIsAuthenticated(!!jwt);
  }, [jwt]);

  const saveToken = useCallback((token: string) => {
    localStorage.setItem(JWT_KEY, token);
    setJwt(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(JWT_KEY);
    setJwt(null);
  }, []);

  return { jwt, isAuthenticated, saveToken, logout };
}
