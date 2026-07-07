import { X, AlertTriangle } from 'lucide-react';
import { Spinner } from './Loading';

// Generic Modal
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${maxWidth} w-full`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-white hover:text-accent transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Confirm Dialog
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', isLoading }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal max-w-sm w-full">
        <div className="modal-header bg-danger border-danger">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} />
            <h2 className="text-base font-black uppercase">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-red-200"><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="text-sm font-medium text-secondary">{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-outline btn-sm">Cancel</button>
          <button onClick={onConfirm} className="btn-danger btn-sm" disabled={isLoading}>
            {isLoading ? <Spinner size={14} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
