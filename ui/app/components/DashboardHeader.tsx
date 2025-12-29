'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/app/components/Icon';
import { 
  faBars, 
  faTimes, 
  faBell, 
  faRightFromBracket, 
  faUserShield, 
  faSearch, 
  faCog, 
  faChevronDown,
  faArrowRight,
  faUser,
  faSpinner,
  faBox,
  faIdCard as faCar,
  faUser as faUserIcon,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/store/auth';
import { NotificationsAPI } from '@/lib/api';
import { toast } from '@/app/components/Toaster';

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
}

export default function DashboardHeader({ 
  onMenuToggle,
  sidebarOpen = false,
  sidebarCollapsed = false
}: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        setLoadingNotifications(true);
        const [notificationsResponse, unreadResponse] = await Promise.all([
          NotificationsAPI.getAll({ page: 1, limit: 10, read: false }),
          NotificationsAPI.getUnreadCount(),
        ]);
        setNotifications(notificationsResponse.data || []);
        setUnreadCount(unreadResponse.unread_count || 0);
      } catch (error: any) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await NotificationsAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read_at: new Date() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Search functionality - simplified for now
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchOpen(false);
      return;
    }

    const searchTimeout = setTimeout(() => {
      setSearchLoading(false);
      setSearchOpen(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    if (userMenuOpen || notificationsOpen || searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, notificationsOpen, searchOpen]);

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchTerm.trim()) {
      setSearchOpen(true);
    }
  };

  // Handle Enter key in search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setSearchOpen(false);
      router.push(`/dashboard/orders?search=${encodeURIComponent(searchTerm.trim())}`);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!mounted) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center h-20 w-full">
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded ml-6"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center h-20 w-full">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 transition-colors lg:hidden ml-6"
          aria-label="Toggle menu"
        >
          <Icon icon={sidebarOpen ? faTimes : faBars} className="text-gray-700" />
        </button>

        {/* Search Input - Left side */}
        <div className="flex-shrink-0 pl-6 pr-4 hidden md:block" ref={searchRef}>
          <div className="relative w-80 max-w-md">
            <Icon 
              icon={searchLoading ? faSpinner : faSearch} 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 ${searchLoading ? 'animate-spin' : ''}`} 
              size="sm" 
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search orders, vehicles, users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#0b66c2] focus:ring-1 focus:ring-[#0b66c2] text-sm"
            />

            {/* Search Results Dropdown - Placeholder for now */}
            {searchOpen && searchTerm.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-lg z-50 p-4">
                <p className="text-sm text-gray-500 text-center">Search functionality coming soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Spacer to push right content to the right */}
        <div className="flex-1"></div>

        {/* Right: Notifications & User Menu */}
        <div className="flex items-center gap-3 flex-shrink-0 px-4 sm:px-6 lg:px-8">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 hover:bg-gray-100 transition-colors rounded-sm"
                aria-label="Notifications"
              >
                <Icon icon={faBell} className="text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 z-50 max-h-96 overflow-y-auto rounded-sm">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-sm text-[#0b66c2] hover:text-[#09529a]"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="py-2">
                    {loadingNotifications ? (
                      <div className="p-4 text-center">
                        <Icon icon={faSpinner} className="animate-spin text-gray-400 mx-auto" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => {
                        const isUnread = !notification.read_at;
                        const timeAgo = new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                              isUnread ? 'bg-[#0b66c2]/5' : ''
                            }`}
                            onClick={() => {
                              if (isUnread) {
                                handleMarkAsRead(notification.id, {} as React.MouseEvent);
                              }
                              setNotificationsOpen(false);
                            }}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                              isUnread ? 'bg-[#0b66c2]/10' : 'bg-gray-100'
                            }`}>
                              <Icon
                                icon={faBell}
                                className={isUnread ? 'text-[#0b66c2]' : 'text-gray-600'}
                                size="sm"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                            </div>
                            {isUnread && (
                              <div className="w-2 h-2 bg-[#0b66c2] rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {notifications.length > 5 && (
                    <div className="p-3 border-t border-gray-200 text-center">
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-sm text-[#0b66c2] hover:text-[#09529a] flex items-center justify-center gap-1"
                      >
                        View all notifications
                        <Icon icon={faArrowRight} size="xs" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 relative" ref={userMenuRef}>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-600">
                  {user?.roles?.[0]?.code || user?.roles?.[0]?.name || 'User'}
                </p>
              </div>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 transition-colors rounded-sm"
                aria-label="User menu"
              >
                <div className="w-10 h-10 bg-[#0b66c2]/10 rounded-full flex items-center justify-center">
                  <Icon icon={faUserShield} className="text-[#0b66c2]" />
                </div>
                <Icon icon={faChevronDown} className={`text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} size="sm" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 z-50 rounded-sm">
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon icon={faUser} className="text-gray-500" size="sm" />
                      <span>Profile</span>
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Icon icon={faRightFromBracket} className="text-gray-500" size="sm" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </header>
  );
}

