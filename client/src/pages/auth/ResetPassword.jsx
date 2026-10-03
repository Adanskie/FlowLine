import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function ResetPassword() {
  const nav = useNavigate();
  const [form,    setForm]    = useState({ token: '', new_password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }
    if (form.new_password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: form.token, new_password: form.new_password });
      setSuccess(true);
      setTimeout(() => nav('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Reset failed. The token may be expired.');
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

        {success ? (
          <div className="text-center">
            <div className="rounded-circle bg-success d-flex align-items-center justify-content-center mx-auto mb-3"
                 style={{ width: 60, height: 60 }}>
              <i className="bi bi-check-lg text-white fs-3"></i>
            </div>
            <h5 className="fw-bold mb-2">Password Updated</h5>
            <p className="text-muted small mb-4">Your password has been changed. Redirecting you to login…</p>
            <Link to="/login" className="btn btn-primary w-100">Go to Login</Link>
          </div>
        ) : (
          <>
            <h5 className="fw-bold mb-1">Reset your password</h5>
            <p className="text-muted small mb-4">Paste the reset token you received and set a new password.</p>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
                <i className="bi bi-exclamation-circle-fill"></i>{error}
              </div>
            )}

            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Reset Token <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-key text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 font-monospace"
                    placeholder="Paste token here…"
                    value={form.token}
                    onChange={e => f('token', e.target.value)}
                    required autoFocus
                    style={{ fontSize: '.8rem' }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">New Password <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0"
                    placeholder="Min. 6 characters"
                    value={form.new_password}
                    onChange={e => f('new_password', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Confirm Password <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock-fill text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className={`form-control border-start-0 ${form.confirm && form.confirm !== form.new_password ? 'is-invalid' : ''}`}
                    placeholder="Repeat new password"
                    value={form.confirm}
                    onChange={e => f('confirm', e.target.value)}
                    required
                  />
                  {form.confirm && form.confirm !== form.new_password && (
                    <div className="invalid-feedback">Passwords do not match.</div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-semibold mb-3"
                      style={{ background: '#4f46e5', border: 'none', padding: '.65rem' }}
                      disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Set New Password
              </button>
              <div className="text-center">
                <Link to="/login" className="text-muted small">
                  <i className="bi bi-arrow-left me-1"></i>Back to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
