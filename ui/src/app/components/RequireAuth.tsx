'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import LoadingSpinner from './LoadingSpinner';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const router = useRouter();
  const { user, loading, loadUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user && !loading) {
        await loadUser();
      }
      setIsChecking(false);
    };
    checkAuth();
  }, [user, loading, loadUser]);

  useEffect(() => {
    if (!isChecking && !loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, isChecking, router]);

  // Check roles if specified
  useEffect(() => {
    if (!isChecking && !loading && user && roles && roles.length > 0) {
      const userRoles = user.roles?.map(r => r.code) || [];
      const hasRequiredRole = roles.some(role => userRoles.includes(role)) || userRoles.includes('SUPER_ADMIN');
      
      if (!hasRequiredRole) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, isChecking, roles, router]);

  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check roles if specified
  if (roles && roles.length > 0) {
    const userRoles = user.roles?.map(r => r.code) || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role)) || userRoles.includes('SUPER_ADMIN');
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}

