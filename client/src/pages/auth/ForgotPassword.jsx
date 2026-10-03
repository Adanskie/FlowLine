import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ForgotPassword() {
  const [username,  setUsername]  = useState('');
  const [result,    setResult]    = useState(null);  // { message, demo_token }
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { username });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f4ff 0%,#e8ecff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: '2.5rem', boxShadow: '0 8px 32px rgba(79,70,229,.10)', border: '1px solid rgba(79,70,229,.12)' }}>

        {/* Brand */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: '#4f46e5' }}>
            <i className="bi bi-diagram-3-fill text-white"></i>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Flowline</span>
        </div>

        <h5 className="fw-bold mb-1">Forgot your password?</h5>
        <p className="text-muted small mb-4">Enter your username and we'll generate a reset token for you.</p>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
            <i className="bi bi-exclamation-circle-fill"></i>{error}
          </div>
        )}

        {/* Success state — show the token */}
        {result ? (
          <div>
            <div className="alert alert-success small mb-3">
              <i className="bi bi-check-circle-fill me-2"></i>{result.message}
            </div>

            {result.demo_token && (
              <div className="card border-warning mb-4">
                <div className="card-body py-3 px-3">
                  <p className="fw-semibold small mb-1">
                    <i className="bi bi-info-circle-fill text-warning me-1"></i>
                    Demo Mode — Reset Token
                  </p>
                  <p className="text-muted small mb-2">{result.demo_note}</p>
                  <code className="d-block bg-light p-2 rounded small" style={{ wordBreak: 'break-all', userSelect: 'all' }}>
                    {result.demo_token}
                  </code>
                  <button
                    className="btn btn-sm btn-outline-secondary mt-2"
                    onClick={() => { navigator.clipboard.writeText(result.demo_token); }}
                  >
                    <i className="bi bi-clipboard me-1"></i>Copy token
                  </button>
                </div>
              </div>
            )}

            <Link to="/reset-password" className="btn btn-primary w-100">
              Go to Reset Password <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-4">
              <label className="form-label small fw-semibold">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-person text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="your.username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required autoFocus
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 fw-semibold mb-3"
                    style={{ background: '#4f46e5', border: 'none', padding: '.65rem' }}
                    disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              Generate Reset Token
            </button>
            <div className="text-center">
              <Link to="/login" className="text-muted small">
                <i className="bi bi-arrow-left me-1"></i>Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
