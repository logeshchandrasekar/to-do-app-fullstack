// src/pages/Dashboard.jsx
import { Flame, PartyPopper, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import StatCard from '../components/StatCard';
import WeeklyChart from '../components/WeeklyChart';
import PriorityDonut from '../components/PriorityDonut';

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard() {
    const { user } = useAuth();
    const { stats, loading, justLeveledUp } = useGame();

    const totals = stats?.totals ?? { total: 0, active: 0, completed: 0, completionRate: 0 };
    const g = stats?.gamification ?? { xp: 0, level: 1, xpIntoLevel: 0, xpForNextLevel: 100, streak: 0, longestStreak: 0 };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="font-display text-lg sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {greeting()}{user?.email ? ', ' + user.email.split('@')[0] : ''}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Here's where things stand today.</p>
            </div>

            {justLeveledUp && (
                <div
                    className="mb-6 rounded-2xl px-5 py-3 flex items-center gap-3 border animate-pop-in"
                    style={{ background: 'var(--amber-soft)', borderColor: 'var(--amber)', color: 'var(--text-primary)' }}
                >
                    <PartyPopper size={20} style={{ color: 'var(--amber)' }} />
                    <span className="font-medium">Level up! You're now level {g.level}.</span>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total tasks" value={totals.total} />
                <StatCard label="Active" value={totals.active} accent="amber" />
                <StatCard label="Completed" value={totals.completed} accent="teal" />
                <StatCard label="Completion rate" value={totals.completionRate} suffix="%" accent="violet" progress={totals.completionRate} />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>This week</h2>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>tasks completed / day</span>
                    </div>
                    <WeeklyChart data={stats?.weekly ?? []} />
                </div>
                <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <h2 className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>By priority</h2>
                    <PriorityDonut breakdown={stats?.priorityBreakdown} />
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <span className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-soft)' }}>
                        <Flame size={22} className={g.streak > 0 ? 'flame-flicker' : ''} style={{ color: 'var(--amber)' }} />
                    </span>
                    <div>
                        <p className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{g.streak}-day streak</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Longest: {g.longestStreak} days</p>
                    </div>
                </div>
                <div className="rounded-2xl p-5 border flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <span className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--violet-soft)' }}>
                        <Sparkles size={22} style={{ color: 'var(--violet)' }} />
                    </span>
                    <div className="flex-1">
                        <p className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Level {g.level} <span className="text-sm font-normal font-mono" style={{ color: 'var(--text-secondary)' }}>· {g.xpIntoLevel}/{g.xpForNextLevel} XP</span>
                        </p>
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(g.xpIntoLevel / g.xpForNextLevel) * 100}%`, background: 'var(--violet)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {!loading && totals.total === 0 && (
                <p className="text-center text-sm mt-10" style={{ color: 'var(--text-tertiary)' }}>
                    No tasks yet — add one below and start earning XP.
                </p>
            )}
        </div>
    );
}
