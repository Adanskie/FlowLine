import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.username, form.password);
      const dest = { Administrator: '/admin/dashboard', Manager: '/manager/dashboard', Employee: '/employee/dashboard' };
      navigate(dest[user.role] ?? '/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#e8ecff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: '2.5rem', boxShadow: '0 8px 32px rgba(79,70,229,.10)', border: '1px solid rgba(79,70,229,.12)' }}>

        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: '#4f46e5' }}>
            <i className="bi bi-diagram-3-fill text-white"></i>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Flowline</span>
        </div>

        <h5 className="fw-bold mb-1">Welcome back</h5>
        <p className="text-muted small mb-4">Sign in to your account to continue.</p>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
            <i className="bi bi-exclamation-circle-fill"></i>{error}
          </div>
        )}

        <form onSubmit={handle}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0"><i className="bi bi-person text-muted"></i></span>
              <input type="text" className="form-control border-start-0" placeholder="your.username"
                value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required autoFocus />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
              <input type="password" className="form-control border-start-0" placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}
                  style={{ background: '#4f46e5', border: 'none', padding: '.65rem' }}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Sign in <i className="bi bi-arrow-right ms-1"></i>
          </button>
          <div className="text-center mt-3">
            <Link to="/forgot-password" className="text-muted small">
              Forgot your password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
