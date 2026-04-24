import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { AdminRole } from '@/types';

export default function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: AdminRole[] }) {
  const { isLoaded, isLoggedIn, hasRole } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect to="/admin/login" />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Redirect to="/admin" />;
  }

  return <>{children}</>;
}
