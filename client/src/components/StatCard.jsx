// src/components/StatCard.jsx
import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 700) {
    const [value, setValue] = useState(0);
    const startRef = useRef(null);

    useEffect(() => {
        let raf;
        const step = (ts) => {
            if (startRef.current == null) startRef.current = ts;
            const progress = Math.min(1, (ts - startRef.current) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) raf = requestAnimationFrame(step);
        };
        startRef.current = null;
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    return value;
}

export default function StatCard({ label, value, suffix = '', accent = 'violet', progress }) {
    const animated = useCountUp(typeof value === 'number' ? value : 0);
    const display = typeof value === 'number' ? animated : value;

    return (
        <div
            className="rounded-2xl p-5 border transition hover:-translate-y-0.5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
            <p className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {display}{suffix}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            {typeof progress === 'number' && (
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, progress)}%`, background: `var(--${accent})` }}
                    />
                </div>
            )}
        </div>
    );
}
