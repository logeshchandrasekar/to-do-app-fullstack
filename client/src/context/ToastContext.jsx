// src/context/ToastContext.jsx
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    }, []);

    const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="animate-pop-in pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg border backdrop-blur-md"
                        style={{
                            background: t.type === 'error' ? 'var(--rose-soft)' : 'var(--teal-soft)',
                            borderColor: t.type === 'error' ? 'var(--rose)' : 'var(--teal)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        {t.type === 'error' ? (
                            <XCircle size={18} style={{ color: 'var(--rose)' }} />
                        ) : (
                            <CheckCircle2 size={18} style={{ color: 'var(--teal)' }} />
                        )}
                        <span className="text-sm font-medium">{t.message}</span>
                        <button onClick={() => dismiss(t.id)} className="ml-1 opacity-60 hover:opacity-100">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
