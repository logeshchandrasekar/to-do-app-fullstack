// src/components/PriorityDonut.jsx
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = { High: 'var(--rose)', Medium: 'var(--amber)', Low: 'var(--teal)' };

function DonutTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div
            className="rounded-lg px-3 py-2 text-xs border shadow-lg"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
            {p.name}: {p.value}
        </div>
    );
}

export default function PriorityDonut({ breakdown }) {
    const data = Object.entries(breakdown || {}).map(([name, value]) => ({ name, value }));
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
        return (
            <div className="h-[220px] flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No tasks yet — add one to see the breakdown.
            </div>
        );
    }

    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={COLORS[entry.name]} />
                        ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{total}</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>tasks</span>
            </div>
            <div className="flex justify-center gap-4 mt-2">
                {data.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[d.name] }} />
                        {d.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
