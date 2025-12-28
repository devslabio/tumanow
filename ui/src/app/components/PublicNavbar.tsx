'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Button from './Button';
import Icon, { faTruck, faUser, faSignOut } from './Icon';

export default function PublicNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#0b66c2] border-b border-[#073d77] sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Icon icon={faTruck} className="text-white" size="2x" />
            <span className="text-2xl font-extrabold text-white">TumaNow</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-base font-semibold transition-colors ${
                isActive('/') ? 'text-white font-bold' : 'text-white/90 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              href="/track"
              className={`text-base font-semibold transition-colors ${
                isActive('/track') ? 'text-white font-bold' : 'text-white/90 hover:text-white'
              }`}
            >
              Track Order
            </Link>
            <Link
              href="/create-order"
              className={`text-base font-semibold transition-colors ${
                isActive('/create-order') ? 'text-white font-bold' : 'text-white/90 hover:text-white'
              }`}
            >
              Create Order
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="md" icon={faUser} className="text-white font-semibold hover:bg-white/20">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="secondary" size="md" icon={faSignOut} onClick={logout} className="font-semibold">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="md" className="text-white font-semibold hover:bg-white/20">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="md" className="font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

