// src/pages/Tasks.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import { Plus, Search } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useGame } from '../context/GameContext';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
];

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('custom');
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const { showToast } = useToast();
    const { applyDelta, refreshStats } = useGame();
    const listRef = useRef(null);
    const sortableRef = useRef(null);
    const searchDebounce = useRef(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ status: statusFilter, sortBy, search: searchTerm });
            const data = await apiFetch(`/tasks?${query}`);
            setTasks(data);
        } catch (err) {
            showToast(err.message || 'Could not load your tasks.', 'error');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, sortBy, searchTerm]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Debounce search input -> searchTerm
    useEffect(() => {
        clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => setSearchTerm(searchInput), 300);
        return () => clearTimeout(searchDebounce.current);
    }, [searchInput]);

    // Drag-to-reorder, only active when viewing "My Order" (custom sort)
    useEffect(() => {
        if (sortBy !== 'custom' || !listRef.current) return; // any previous instance was already destroyed by the last cleanup
        sortableRef.current = new Sortable(listRef.current, {
            animation: 150,
            ghostClass: 'opacity-40',
            onEnd: async () => {
                const orderedIds = Array.from(listRef.current.children).map((el) => el.dataset.taskId);
                setTasks((prev) => {
                    const byId = Object.fromEntries(prev.map((t) => [t.id, t]));
                    return orderedIds.map((id) => byId[id]).filter(Boolean);
                });
                try {
                    await apiFetch('/tasks/reorder', { method: 'POST', body: JSON.stringify({ orderedIds }) });
                } catch (err) {
                    showToast('Could not save the new order.', 'error');
                }
            },
        });
        return () => {
            sortableRef.current?.destroy();
            sortableRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, tasks.length]);

    const handleSaveTask = async ({ id, title, priority, deadline }) => {
        try {
            if (id) {
                await apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ title, priority, deadline }) });
                showToast('Task updated!');
            } else {
                await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title, priority, deadline }) });
                showToast('Task added!');
            }
            setModalOpen(false);
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            showToast(err.message || 'Could not save task.', 'error');
        }
    };

    const handleToggleComplete = async (task) => {
        const nextCompleted = !task.completed;
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)));
        try {
            const res = await apiFetch(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ completed: nextCompleted }) });
            if (res.gamification) applyDelta(res.gamification);
            refreshStats();
        } catch (err) {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
            showToast(err.message || 'Could not update task status.', 'error');
        }
    };

    const handleDelete = async () => {
        const id = deleteTargetId;
        setDeleteTargetId(null);
        try {
            await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
            setTasks((prev) => prev.filter((t) => t.id !== id));
            showToast('Task deleted.');
            refreshStats();
        } catch (err) {
            showToast(err.message || 'Could not delete task.', 'error');
        }
    };

    const handleAddSubtask = async (taskId, title) => {
        try {
            const newSubtask = await apiFetch(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) });
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t)));
        } catch (err) {
            showToast(err.message || 'Could not add subtask.', 'error');
        }
    };

    const handleToggleSubtask = async (subtaskId, completed) => {
        setTasks((prev) => prev.map((t) => ({ ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed } : s)) })));
        try {
            await apiFetch(`/subtasks/${subtaskId}`, { method: 'PUT', body: JSON.stringify({ completed }) });
        } catch (err) {
            showToast(err.message || 'Could not update subtask.', 'error');
        }
    };

    const handleDeleteSubtask = async (taskId, subtaskId) => {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t)));
        try {
            await apiFetch(`/subtasks/${subtaskId}`, { method: 'DELETE' });
        } catch (err) {
            showToast(err.message || 'Could not delete subtask.', 'error');
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
                <h2 className="font-display text-lg sm:text-xl font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>My Tasks</h2>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <div className="relative mb-4">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-transparent outline-none"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
            </div>

            <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-2.5 rounded-xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
                <div className="flex items-center gap-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                            style={{
                                background: statusFilter === f.key ? 'var(--violet)' : 'transparent',
                                color: statusFilter === f.key ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <label style={{ color: 'var(--text-secondary)' }}>Sort:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg py-1.5 px-2 outline-none border"
                        style={{ background: '#f3f4f6', borderColor: '#d1d5db', color: '#374151', colorScheme: 'light' }}
                    >
                        <option value="custom">My order</option>
                        <option value="createdAt">Date created</option>
                        <option value="priority">Priority</option>
                        <option value="deadline">Deadline</option>
                    </select>
                </div>
            </div>

            <div ref={listRef} className="space-y-2.5 min-h-[80px]">
                {!loading && tasks.length === 0 && (
                    <div className="text-center py-14 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                        {searchTerm ? `No tasks found for "${searchTerm}".` : 'No tasks match your filters.'}
                    </div>
                )}
                {tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={(t) => { setEditingTask(t); setModalOpen(true); }}
                        onDelete={setDeleteTargetId}
                        onAddSubtask={handleAddSubtask}
                        onToggleSubtask={handleToggleSubtask}
                        onDeleteSubtask={handleDeleteSubtask}
                    />
                ))}
            </div>

            <button
                onClick={() => { setEditingTask(null); setModalOpen(true); }}
                className="w-full mt-4 border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition hover:border-solid"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
                <Plus size={16} /> Add task
            </button>

            <TaskModal open={modalOpen} task={editingTask} onSave={handleSaveTask} onClose={() => { setModalOpen(false); setEditingTask(null); }} />
            <ConfirmModal
                open={!!deleteTargetId}
                title="Delete this task?"
                message="This can't be undone — subtasks will be removed too."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTargetId(null)}
            />
        </div>
    );
}
