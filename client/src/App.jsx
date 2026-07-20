// src/App.jsx
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GameProvider } from './context/GameContext';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';

function useTheme() {
    const [theme, setTheme] = useState(() => localStorage.getItem('taskflow_theme') || 'dark');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('taskflow_theme', theme);
    }, [theme]);

    return { theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}

function AppShell() {
    const { isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();

    if (!isAuthenticated) return <AuthPage />;

    return (
        <GameProvider>
            <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
                <Header theme={theme} onToggleTheme={toggleTheme} />
                <main className="px-4 sm:px-6 lg:px-8 py-6">
                    <Home />
                </main>
            </div>
        </GameProvider>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <AppShell />
            </AuthProvider>
        </ToastProvider>
    );
}
