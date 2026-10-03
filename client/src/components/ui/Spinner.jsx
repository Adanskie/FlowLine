export default function Spinner({ fullscreen = false }) {
  if (fullscreen) {
    return (
      <div className="d-flex align-items-center justify-content-center"
           style={{ minHeight: '100vh', background: '#f5f6fa' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }
  return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );
}
