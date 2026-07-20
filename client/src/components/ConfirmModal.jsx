// src/components/ConfirmModal.jsx
export default function ConfirmModal({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="animate-pop-in w-full max-w-sm rounded-2xl p-7 text-center border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                <h2 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
                <div className="flex justify-center gap-3">
                    <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--rose)' }}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
