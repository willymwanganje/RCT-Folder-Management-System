import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onClose, danger }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="confirm-copy">{message}</p>
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={`btn ${danger ? "danger" : "primary"}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
