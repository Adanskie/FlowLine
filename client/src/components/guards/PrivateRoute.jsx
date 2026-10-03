import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

/**
 * Protects routes that require authentication.
 * Optionally restricts to specific roles: <PrivateRoute roles={['Administrator']} />
 */
export default function PrivateRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner fullscreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;

  return <Outlet />;
}
