'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';

export const AuthGuard = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/'); // Or a 403 page
      }
    }
  }, [user, loading, router, pathname, allowedRoles]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user && pathname !== '/login' && pathname !== '/register') {
    return null;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export const RoleGuard = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Role[] }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }
  
  return <>{children}</>;
};
