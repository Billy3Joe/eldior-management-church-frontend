export default function ConfirmModal({
  isOpen,
  title = "Confirmation",
  message = "Êtes-vous sûr ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="delete-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Suppression..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}