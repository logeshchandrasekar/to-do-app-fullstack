// src/components/TaskItem.jsx
import { useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { priorityColor } from './TaskModal';

function formatDeadline(deadline) {
    if (!deadline) return null;
    const d = new Date(deadline);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function TaskItem({
    task,
    onToggleComplete,
    onEdit,
    onDelete,
    onAddSubtask,
    onToggleSubtask,
    onDeleteSubtask,
}) {
    const [expanded, setExpanded] = useState(false);
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [subtaskTitle, setSubtaskTitle] = useState('');

    const handleAddSubtask = (e) => {
        e.preventDefault();
        if (!subtaskTitle.trim()) return;
        onAddSubtask(task.id, subtaskTitle.trim());
        setSubtaskTitle('');
    };

    const deadlineLabel = formatDeadline(task.deadline);
    const overdue = task.deadline && !task.completed && new Date(task.deadline) < new Date();

    return (
        <div
            data-task-id={task.id}
            className="task-item group rounded-xl border p-4 cursor-grab active:cursor-grabbing transition hover:-translate-y-0.5"
            style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                borderLeft: `3px solid ${priorityColor(task.priority)}`,
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleComplete(task)}
                        className="mt-1 h-5 w-5 rounded-md flex-shrink-0 cursor-pointer accent-white"
                    />
                    <div className="min-w-0">
                        <p
                            className="font-medium truncate"
                            style={{ color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}
                        >
                            {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${priorityColor(task.priority)}1a`, color: priorityColor(task.priority) }}>
                                {task.priority}
                            </span>
                            {deadlineLabel && (
                                <span className="text-xs" style={{ color: overdue ? 'var(--rose)' : 'var(--text-tertiary)' }}>
                                    {overdue ? 'Overdue · ' : ''}{deadlineLabel}
                                </span>
                            )}
                            {task.subtasks.length > 0 && (
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                    <button onClick={() => setExpanded((v) => !v)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }} aria-label="Toggle subtasks">
                        <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }} aria-label="Edit task">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--rose)' }} aria-label="Delete task">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="pl-8 mt-3 space-y-1.5 animate-pop-in">
                    {task.subtasks.map((st) => (
                        <div key={st.id} className="flex items-center justify-between py-1 px-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: st.completed ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: st.completed ? 'line-through' : 'none' }}>
                                <input
                                    type="checkbox"
                                    checked={st.completed}
                                    onChange={(e) => onToggleSubtask(st.id, e.target.checked)}
                                    className="h-4 w-4 rounded cursor-pointer accent-[var(--violet)]"
                                />
                                {st.title}
                            </label>
                            <button onClick={() => onDeleteSubtask(task.id, st.id)} className="p-1 rounded" style={{ color: 'var(--rose)' }} aria-label="Delete subtask">
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    {showSubtaskForm ? (
                        <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                            <input
                                autoFocus
                                type="text"
                                value={subtaskTitle}
                                onChange={(e) => setSubtaskTitle(e.target.value)}
                                placeholder="New subtask..."
                                className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border bg-transparent outline-none"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <button type="submit" className="p-1.5 rounded-lg text-white" style={{ background: 'var(--violet)' }}>
                                <Plus size={14} />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowSubtaskForm(true)}
                            className="text-sm font-medium pt-1"
                            style={{ color: 'var(--violet)' }}
                        >
                            + Add subtask
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
