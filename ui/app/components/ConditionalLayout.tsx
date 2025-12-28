'use client';

import { usePathname } from 'next/navigation';
import PublicNavbar from '../../src/app/components/PublicNavbar';
import PublicFooter from '../../src/app/components/PublicFooter';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const isDashboardPage = pathname?.startsWith('/dashboard');

  // Hide navbar and footer for auth pages and dashboard pages
  if (isAuthPage || isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

