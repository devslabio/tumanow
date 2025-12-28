'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardHeader from '../components/DashboardHeader';
import { RequireAuth } from '@/app/components';
import CustomerDashboardLayout from './customer-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  
  // Check if user is a customer
  const isCustomer = user?.roles?.some((r: any) => 
    (r.code || r.name) === 'CUSTOMER'
  ) || false;

  // If customer, use different layout
  if (isCustomer) {
    return (
      <RequireAuth>
        <CustomerDashboardLayout>
          {children}
        </CustomerDashboardLayout>
      </RequireAuth>
    );
  }

  // For admin/operator users, use sidebar + header layout
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  return (
    <RequireAuth>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          onCollapsedChange={handleCollapsedChange}
        />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <DashboardHeader
            onMenuToggle={handleSidebarToggle}
            sidebarOpen={sidebarOpen}
            sidebarCollapsed={sidebarCollapsed}
          />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}

