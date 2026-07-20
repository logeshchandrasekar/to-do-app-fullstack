// src/components/LevelRing.jsx
import { useGame } from '../context/GameContext';

export default function LevelRing({ size = 44 }) {
    const { stats, justLeveledUp } = useGame();
    const g = stats?.gamification;
    const pct = g ? Math.min(100, Math.round((g.xpIntoLevel / g.xpForNextLevel) * 100)) : 0;
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className={`relative flex items-center justify-center flex-shrink-0 ${justLeveledUp ? 'level-up-glow rounded-full' : ''}`} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth="4" fill="none" stroke="var(--border)" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth="4"
                    fill="none"
                    stroke="var(--violet)"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
                />
            </svg>
            <span className="absolute font-display font-bold" style={{ fontSize: size * 0.32, color: 'var(--text-primary)' }}>
                {g?.level ?? 1}
            </span>
        </div>
    );
}
