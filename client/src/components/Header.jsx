// src/components/Header.jsx
import { CheckCircle2, Flame, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import LevelRing from './LevelRing';

export default function Header({ theme, onToggleTheme }) {
    const { logout } = useAuth();
    const { stats, popups } = useGame();
    const streak = stats?.gamification?.streak ?? 0;

    return (
        <header
            className="sticky top-0 z-30 border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
                        <CheckCircle2 size={20} />
                    </span>
                    <span className="hidden sm:inline font-display font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                        TaskFlow
                    </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                        {popups.map((p) => (
                            <span key={p.id} className="xp-float absolute -top-2 right-0 text-xs font-bold font-mono" style={{ color: 'var(--amber)' }}>
                                +{p.xp} XP
                            </span>
                        ))}
                        <div
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-sm font-mono font-semibold"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                        >
                            <Flame size={16} className="flame-flicker" style={{ color: streak > 0 ? 'var(--amber)' : 'var(--text-tertiary)' }} />
                            {streak}
                        </div>
                    </div>

                    <LevelRing size={40} />

                    <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--border)' }} />

                    <button
                        onClick={onToggleTheme}
                        aria-label="Toggle theme"
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={logout}
                        aria-label="Log out"
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ color: 'var(--rose)' }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
