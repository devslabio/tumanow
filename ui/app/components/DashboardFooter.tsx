'use client';

import Link from 'next/link';
import Icon, { faTruck, faEnvelope, faPhone } from '@/app/components/Icon';

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 flex-shrink-0 z-10">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Logo and Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0b66c2] rounded-full flex items-center justify-center">
              <Icon icon={faTruck} className="text-white" size="sm" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">TumaNow</p>
              <p className="text-xs text-gray-500">
                © {currentYear} All rights reserved.
              </p>
            </div>
          </div>

          {/* Center: Links */}
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-gray-600 hover:text-[#0b66c2] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-xs font-medium text-gray-600 hover:text-[#0b66c2] transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/"
              className="text-xs font-medium text-gray-600 hover:text-[#0b66c2] transition-colors"
            >
              Website
            </Link>
          </nav>

          {/* Right: Contact Info */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <a
              href="mailto:support@tumanow.rw"
              className="flex items-center gap-2 hover:text-[#0b66c2] transition-colors"
            >
              <Icon icon={faEnvelope} size="xs" />
              <span className="hidden md:inline">support@tumanow.rw</span>
            </a>
            <a
              href="tel:+250788000000"
              className="flex items-center gap-2 hover:text-[#0b66c2] transition-colors"
            >
              <Icon icon={faPhone} size="xs" />
              <span className="hidden md:inline">+250 788 000 000</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

