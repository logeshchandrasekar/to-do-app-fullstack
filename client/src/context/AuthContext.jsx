// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, decodeToken, getToken, removeToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setTokenState] = useState(() => getToken());
    const user = useMemo(() => (token ? decodeToken(token) : null), [token]);

    const logout = useCallback(() => {
        removeToken();
        setTokenState(null);
    }, []);

    // If any API call gets a 401/403, api.js broadcasts this so we log out everywhere consistently.
    useEffect(() => {
        const handler = () => setTokenState(null);
        window.addEventListener('taskflow:auth-error', handler);
        return () => window.removeEventListener('taskflow:auth-error', handler);
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        setToken(data.token);
        setTokenState(data.token);
    }, []);

    const register = useCallback(async (email, password) => {
        await apiFetch('/register', { method: 'POST', body: JSON.stringify({ email, password }) });
    }, []);

    const value = { token, user, isAuthenticated: !!user, login, register, logout };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
