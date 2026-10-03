import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <h1 className="display-1 fw-bold text-primary">404</h1>
      <h4 className="mb-2">Page not found</h4>
      <p className="text-muted mb-4">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}
