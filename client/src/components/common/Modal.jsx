import { useEffect, useRef } from 'react';

export default function Modal({ title, children, onClose, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const focusable = dialog?.querySelector('input, select, textarea, button');
    focusable?.focus();
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onClose, busy }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="confirm" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2></header>
        <div className="body"><p>{message}</p></div>
        <footer>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" type="button" onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
        </footer>
      </div>
    </div>
  );
}
