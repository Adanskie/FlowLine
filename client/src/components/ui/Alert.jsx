export default function Alert({ type = 'danger', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible d-flex align-items-center gap-2 py-2 small`} role="alert">
      <i className={`bi bi-${type === 'danger' ? 'exclamation-circle-fill' : type === 'success' ? 'check-circle-fill' : 'info-circle-fill'}`}></i>
      <span>{message}</span>
      {onClose && <button type="button" className="btn-close btn-sm ms-auto" onClick={onClose} />}
    </div>
  );
}
