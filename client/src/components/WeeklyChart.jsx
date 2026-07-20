// src/components/WeeklyChart.jsx
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-lg px-3 py-2 text-xs border shadow-lg"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
            <p className="font-medium mb-0.5">{label}</p>
            <p style={{ color: 'var(--violet)' }}>{payload[0].value} completed</p>
        </div>
    );
}

export default function WeeklyChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--violet-soft)' }} />
                <Bar dataKey="completed" fill="var(--violet)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
        </ResponsiveContainer>
    );
}
