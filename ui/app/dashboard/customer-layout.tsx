'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import Icon from '@/app/components/Icon';
import { faTruck, faSignOut, faUser, faBox, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/app/components';

interface CustomerDashboardLayoutProps {
  children: React.ReactNode;
}

export default function CustomerDashboardLayout({ children }: CustomerDashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer Header - Simple, clean */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <Icon icon={faTruck} className="text-[#0b66c2]" size="lg" />
              <span className="text-xl font-bold text-gray-900">TumaNow</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-[#0b66c2] transition-colors"
              >
                My Orders
              </Link>
              <Link
                href="/create-order"
                className="text-sm font-medium text-gray-700 hover:text-[#0b66c2] transition-colors"
              >
                Create Order
              </Link>
              <Link
                href="/track"
                className="text-sm font-medium text-gray-700 hover:text-[#0b66c2] transition-colors"
              >
                Track Order
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0b66c2]/10 rounded-full flex items-center justify-center">
                  <Icon icon={faUser} className="text-[#0b66c2]" size="sm" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={faSignOut}
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600"
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

