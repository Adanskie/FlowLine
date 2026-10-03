import { Link, useNavigate } from 'react-router-dom';
export default function Forbidden() {
  const nav = useNavigate();
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <h1 className="display-1 fw-bold text-danger">403</h1>
      <h4 className="mb-2">Access Denied</h4>
      <p className="text-muted mb-4">You don't have permission to view this page.</p>
      <div className="d-flex gap-2">
        <button onClick={() => nav(-1)} className="btn btn-outline-secondary">Go back</button>
        <Link to="/" className="btn btn-primary">Dashboard</Link>
      </div>
    </div>
  );
}
