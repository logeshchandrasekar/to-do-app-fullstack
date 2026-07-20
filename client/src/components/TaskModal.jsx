// src/components/TaskModal.jsx
import { useEffect, useRef, useState } from 'react';

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function TaskModal({ open, task, onSave, onClose }) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [deadline, setDeadline] = useState('');
    const [saving, setSaving] = useState(false);
    const titleRef = useRef(null);

    useEffect(() => {
        if (open) {
            setTitle(task?.title ?? '');
            setPriority(task?.priority ?? 'Medium');
            setDeadline(task?.deadline ? task.deadline.slice(0, 16) : '');
            setTimeout(() => titleRef.current?.focus(), 50);
        }
    }, [open, task]);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
            await onSave({ id: task?.id, title: title.trim(), priority, deadline: deadline || null });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="animate-pop-in w-full max-w-md rounded-2xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                <h2 className="font-display text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
                    {task ? 'Edit task' : 'Add a new task'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title</label>
                        <input
                            ref={titleRef}
                            type="text"
                            required
                            autoComplete="off"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border bg-transparent outline-none"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            placeholder="What needs doing?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                        <div className="flex gap-2">
                            {PRIORITIES.map((p) => (
                                <button
                                    type="button"
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className="flex-1 py-2 rounded-xl text-sm font-medium border transition"
                                    style={{
                                        borderColor: priority === p ? priorityColor(p) : 'var(--border)',
                                        background: priority === p ? priorityBg(p) : 'transparent',
                                        color: priority === p ? priorityColor(p) : 'var(--text-secondary)',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deadline (optional)</label>
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border bg-transparent outline-none"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--violet)' }}>
                            {task ? 'Save changes' : 'Add task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function priorityColor(p) {
    return { High: 'var(--rose)', Medium: 'var(--amber)', Low: 'var(--teal)' }[p] ?? 'var(--text-secondary)';
}
export function priorityBg(p) {
    return { High: 'var(--rose-soft)', Medium: 'var(--amber-soft)', Low: 'var(--teal-soft)' }[p] ?? 'transparent';
}
