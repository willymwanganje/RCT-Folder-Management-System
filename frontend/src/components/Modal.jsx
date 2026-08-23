export default function Modal({ title, children, onClose, wide }) {
  return (
    <div
      className="rct-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`rct-modal ${wide ? "rct-modal-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rct-modal-title"
      >
        <header className="rct-modal-header">
          <h2 id="rct-modal-title">{title}</h2>

          <button
            type="button"
            className="rct-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="rct-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}