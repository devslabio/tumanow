'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useI18n } from '@/lib/i18n';
import Button from './Button';
import Icon, { faTruck, faUser, faSignOut } from './Icon';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import LanguageSwitcher from './LanguageSwitcher';

export default function PublicNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t } = useI18n();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#0b66c2] border-b border-white/10 sticky top-0 z-40 shadow-md">
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
              {t('nav.home')}
            </Link>
            <Link
              href="/track"
              className={`text-base font-semibold transition-colors ${
                isActive('/track') ? 'text-white font-bold' : 'text-white/90 hover:text-white'
              }`}
            >
              {t('nav.trackOrder')}
            </Link>
            <Link
              href="/create-order"
              className={`text-base font-semibold transition-colors ${
                isActive('/create-order') ? 'text-white font-bold' : 'text-white/90 hover:text-white'
              }`}
            >
              {t('nav.createOrder')}
            </Link>
          </div>

          {/* Auth Buttons & Language Switcher */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="md" icon={faUser} className="text-white font-semibold hover:bg-white/20">
                    {t('common.dashboard')}
                  </Button>
                </Link>
                <Button variant="secondary" size="md" icon={faSignOut} onClick={logout} className="font-semibold">
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="md" 
                  className="!text-white font-semibold hover:bg-white/20 border border-white/30"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  {t('common.login')}
                </Button>
                <Button 
                  variant="secondary" 
                  size="md" 
                  className="font-semibold"
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  {t('common.signUp')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => setIsRegisterModalOpen(true)}
        onSwitchToForgotPassword={() => setIsForgotPasswordModalOpen(true)}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => setIsLoginModalOpen(true)}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onSwitchToLogin={() => setIsLoginModalOpen(true)}
      />
    </nav>
  );
}

