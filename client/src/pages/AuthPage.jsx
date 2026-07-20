// src/pages/AuthPage.jsx
import { useState } from 'react';
import { CheckCircle2, Flame, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PERKS = [
    { icon: Sparkles, text: 'Earn XP and level up as you clear tasks' },
    { icon: Flame, text: 'Build daily streaks that keep you honest' },
    { icon: CheckCircle2, text: 'See your progress on a real dashboard' },
];

export default function AuthPage() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login, register } = useAuth();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, password);
                showToast('Account created — log in to get started.');
                setMode('login');
                setPassword('');
            }
        } catch (err) {
            showToast(err.message || 'Something went wrong.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
            <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl" style={{ boxShadow: 'var(--shadow-lg)' }}>
                {/* Left: brand panel */}
                <div
                    className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, var(--violet-strong), var(--violet) 55%, #2a1f66)' }}
                >
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20" style={{ background: 'var(--amber-2)' }} />
                    <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full opacity-10 bg-white" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-white/90 font-display font-semibold text-xl tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                                <CheckCircle2 size={18} />
                            </span>
                            TaskFlow
                        </div>
                        <h1 className="mt-10 text-3xl font-display font-semibold text-white leading-snug">
                            Turn your to-do list<br />into a streak you<br />don't want to break.
                        </h1>
                    </div>
                    <ul className="relative z-10 space-y-4">
                        {PERKS.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-white/85 text-sm">
                                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Icon size={15} />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right: form */}
                <div className="p-8 sm:p-10 flex flex-col justify-center" style={{ background: 'var(--surface)' }}>
                    <h2 className="font-display text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {mode === 'login' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                        {mode === 'login' ? 'Log in to pick up your streak.' : 'Takes less than a minute.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border bg-transparent outline-none transition"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                            <input
                                type="password"
                                required
                                minLength={mode === 'register' ? 6 : undefined}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border bg-transparent outline-none transition"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
                            style={{ background: 'var(--violet)', color: 'white' }}
                        >
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            {mode === 'login' ? 'Log in' : 'Sign up'}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                        {mode === 'login' ? (
                            <>No account?{' '}
                                <button onClick={() => setMode('register')} className="font-semibold" style={{ color: 'var(--violet)' }}>Sign up</button>
                            </>
                        ) : (
                            <>Have an account?{' '}
                                <button onClick={() => setMode('login')} className="font-semibold" style={{ color: 'var(--violet)' }}>Log in</button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
