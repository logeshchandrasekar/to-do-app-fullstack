// src/context/GameContext.jsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);
let popupId = 0;

export function GameProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [popups, setPopups] = useState([]);
    const [justLeveledUp, setJustLeveledUp] = useState(false);
    const prevLevel = useRef(null);

    const refreshStats = useCallback(async () => {
        try {
            const data = await apiFetch('/stats');
            setStats(data);
            if (prevLevel.current != null && data.gamification.level > prevLevel.current) {
                setJustLeveledUp(true);
                setTimeout(() => setJustLeveledUp(false), 2800);
            }
            prevLevel.current = data.gamification.level;
        } catch {
            // A logged-out user hitting /stats is expected; AuthContext handles the redirect.
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            refreshStats();
        } else {
            setStats(null);
            prevLevel.current = null;
        }
    }, [isAuthenticated, refreshStats]);

    // Called right after a task PUT response comes back with a `gamification` delta,
    // so the badge updates instantly instead of waiting on a second round trip.
    const applyDelta = useCallback((delta) => {
        if (!delta) return;
        setStats((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                gamification: {
                    ...prev.gamification,
                    xp: Math.max(0, prev.gamification.xp + delta.xpDelta),
                    level: delta.level,
                    xpIntoLevel: delta.xpIntoLevel,
                    xpForNextLevel: delta.xpForNextLevel,
                    streak: delta.streak,
                },
            };
        });
        if (delta.xpDelta > 0) {
            const id = ++popupId;
            setPopups((prev) => [...prev, { id, xp: delta.xpDelta }]);
            setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 1100);
        }
        if (prevLevel.current != null && delta.level > prevLevel.current) {
            setJustLeveledUp(true);
            setTimeout(() => setJustLeveledUp(false), 2800);
        }
        prevLevel.current = delta.level;
    }, []);

    const value = { stats, loading, refreshStats, applyDelta, popups, justLeveledUp };
    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}
