import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="px-6 py-16 text-center text-sm text-stone-500">Loading secure workspace...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
