import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children }) {
  const { student, ready } = useAuth();
  const location = useLocation();

  // Wait until localStorage is rehydrated before deciding
  if (!ready) return <Spinner text="Loading..." />;

  if (!student) {
    // Redirect to login, preserve the page they tried to visit
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
