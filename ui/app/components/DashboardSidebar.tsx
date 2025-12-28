'use client';

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/app/components/Icon';
import {
  faHome,
  faBox,
  faBuilding,
  faIdCard as faCar,
  faUser,
  faClipboardList,
  faReceipt,
  faChartLine,
  faUsers,
  faCog,
  faUserShield,
  faChevronLeft,
  faChevronRight,
  faBars,
  faChevronDown,
  faChevronUp,
  faTruck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/store/auth';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface MenuItem {
  icon: any;
  label: string;
  href?: string;
  children?: MenuItem[];
  roles?: string[]; // Roles that can access this menu
}

export default function DashboardSidebar({ isOpen, onClose, onCollapsedChange }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  
  // Initialize collapsed state from localStorage synchronously if available
  const getInitialCollapsed = () => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('tumanowSidebarCollapsed');
    return saved === 'true';
  };
  
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [userInfo, setUserInfo] = useState<{ name?: string; phone?: string; role?: string } | null>(null);
  
  // Use ref to store the latest callback to avoid including it in dependency arrays
  const onCollapsedChangeRef = useRef(onCollapsedChange);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    onCollapsedChangeRef.current = onCollapsedChange;
  }, [onCollapsedChange]);
  
  // Notify parent of initial state on mount (only once)
  useEffect(() => {
    if (isInitialMount.current) {
      onCollapsedChangeRef.current?.(collapsed);
      isInitialMount.current = false;
    }
  }, []); // Only run on mount

  useEffect(() => {
    // Save to localStorage asynchronously to avoid blocking
    const timeoutId = setTimeout(() => {
      localStorage.setItem('tumanowSidebarCollapsed', collapsed.toString());
    }, 0);
    
    // Only notify parent on user-initiated changes, not on initial mount
    if (!isInitialMount.current) {
      // Use startTransition to make the parent update non-blocking
      startTransition(() => {
        onCollapsedChangeRef.current?.(collapsed);
      });
    }
    
    return () => clearTimeout(timeoutId);
  }, [collapsed]);

  useEffect(() => {
    if (user) {
      let roleLabel = 'User';
      const userRoles = user.roles || [];
      if (userRoles.some((r: any) => (r.code || r.name) === 'SUPER_ADMIN')) roleLabel = 'Super Admin';
      else if (userRoles.some((r: any) => (r.code || r.name) === 'OPERATOR_ADMIN')) roleLabel = 'Operator Admin';
      else if (userRoles.some((r: any) => (r.code || r.name) === 'DISPATCHER')) roleLabel = 'Dispatcher';
      else if (userRoles.some((r: any) => (r.code || r.name) === 'DRIVER')) roleLabel = 'Driver';
      else if (userRoles.some((r: any) => (r.code || r.name) === 'PLATFORM_SUPPORT')) roleLabel = 'Platform Support';
      
      setUserInfo({
        name: user.name || 'User',
        phone: user.phone || '',
        role: roleLabel,
      });
    }
  }, [user]);
  
  // Memoized handlers to prevent unnecessary re-renders
  const handleCollapse = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    isInitialMount.current = false;
    
    startTransition(() => {
      setCollapsed(true);
    });
  }, []);
  
  const handleExpand = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    isInitialMount.current = false;
    
    startTransition(() => {
      setCollapsed(false);
    });
  }, []);

  // Get user role codes (use code field, fallback to name)
  const userRoles = user?.roles || [];
  const userRoleCodes = userRoles.map((r: any) => 
    (r.code || r.name || 'USER').toUpperCase()
  );

  // Define all available menu items with role restrictions
  const allMenuItems: MenuItem[] = [
    { 
      icon: faHome, 
      label: 'Dashboard', 
      href: '/dashboard',
      roles: ['SUPER_ADMIN', 'PLATFORM_SUPPORT', 'OPERATOR_ADMIN', 'DISPATCHER', 'DRIVER'],
    },
    {
      icon: faBox,
      label: 'Orders',
      href: '/dashboard/orders',
      roles: ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'DISPATCHER', 'DRIVER'],
    },
    {
      icon: faBuilding,
      label: 'Operators',
      href: '/dashboard/operators',
      roles: ['SUPER_ADMIN', 'PLATFORM_SUPPORT'],
    },
    {
      icon: faCar,
      label: 'Vehicles',
      href: '/dashboard/vehicles',
      roles: ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'DISPATCHER'],
    },
    {
      icon: faUser,
      label: 'Drivers',
      href: '/dashboard/drivers',
      roles: ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'DISPATCHER'],
    },
    {
      icon: faReceipt,
      label: 'Payments',
      href: '/dashboard/payments',
      roles: ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'PLATFORM_SUPPORT'],
    },
    {
      icon: faChartLine,
      label: 'Reports',
      href: '/dashboard/reports',
      roles: ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'PLATFORM_SUPPORT'],
    },
    {
      icon: faUsers,
      label: 'Users',
      href: '/dashboard/users',
      roles: ['SUPER_ADMIN', 'OPERATOR_ADMIN'],
    },
    { 
      icon: faCog, 
      label: 'Settings', 
      href: '/dashboard/settings',
      roles: ['SUPER_ADMIN', 'OPERATOR_ADMIN'],
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    if (!item.roles) return true; // If no roles specified, show to all
    // Check if user has any of the required roles
    return item.roles.some(role => userRoleCodes.includes(role.toUpperCase()));
  });

  // Auto-expand menu if current path matches
  useEffect(() => {
    const currentMenu = menuItems.find(item => 
      item.href === pathname || 
      item.children?.some(child => child.href === pathname)
    );
    if (currentMenu && currentMenu.children) {
      setExpandedMenus(prev => {
        const menuKey = currentMenu.label.toLowerCase().replace(/\s+/g, '-');
        if (!prev.includes(menuKey)) {
          return [...prev, menuKey];
        }
        return prev;
      });
    }
  }, [pathname, menuItems]);

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  const toggleMenu = (menuLabel: string) => {
    const menuKey = menuLabel.toLowerCase().replace(/\s+/g, '-');
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  const isMenuExpanded = (menuLabel: string) => {
    const menuKey = menuLabel.toLowerCase().replace(/\s+/g, '-');
    return expandedMenus.includes(menuKey);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-[#073d77] border-r border-[#052a54] z-50
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-20' : 'w-64'}
          flex flex-col
          overflow-y-auto
        `}
      >
        {/* Logo Section */}
        <div className="p-5 border-b border-[#052a54] flex-shrink-0">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 flex-1"
              onClick={(e) => {
                if (collapsed) {
                  e.preventDefault();
                }
              }}
            >
              <div className="w-10 h-10 bg-[#052a54] rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon={faTruck} className="text-white" size="lg" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-tight">TumaNow</span>
                  <span className="text-xs text-white/70 leading-tight">Delivery Management</span>
                </div>
              )}
            </Link>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={handleCollapse}
                  className="p-1.5 hover:bg-[#073d77] rounded-sm transition-colors text-white/80 hover:text-white"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <Icon icon={faBars} size="sm" />
                </button>
              )}
              {collapsed && (
                <button
                  type="button"
                  onClick={handleExpand}
                  className="p-1.5 hover:bg-[#073d77] rounded-sm transition-colors text-white/80 hover:text-white"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <Icon icon={faBars} size="sm" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Information Section */}
        {userInfo && (
          <div className={`
            border-b border-[#052a54] flex-shrink-0
            ${collapsed ? 'p-3 flex flex-col items-center' : 'p-5'}
          `}>
            <div className={`
              ${collapsed ? 'w-12 h-12' : 'w-24 h-24'}
              rounded-full bg-[#052a54] flex items-center justify-center flex-shrink-0 ${collapsed ? '' : 'mx-auto mb-3'}
            `}>
              <Icon icon={faUserShield} className="text-white" size={collapsed ? 'sm' : '2x'} />
            </div>
            {!collapsed && (
              <div className="text-center">
                <div className="text-sm font-semibold text-white mb-1 truncate">
                  {userInfo.name}
                </div>
                {userInfo.phone && (
                  <div className="text-xs text-white/70 mb-1 truncate">
                    {userInfo.phone}
                  </div>
                )}
                <div className="text-xs text-white/80 font-medium">
                  {userInfo.role}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 py-4 overflow-y-auto min-h-0">
          <ul className="space-y-1 px-2">
            {menuItems.map((item, index) => {
              const active = isActive(item.href);
              const hasChildren = item.children && item.children.length > 0;
              const menuKey = item.label.toLowerCase().replace(/\s+/g, '-');
              const isExpanded = isMenuExpanded(item.label);

              if (hasChildren) {
                return (
                  <li key={index}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        transition-all duration-200
                        ${collapsed ? 'justify-center' : 'justify-between'}
                        ${
                          item.children?.some(child => isActive(child.href))
                            ? 'bg-[#052a54] text-white border-l-4 border-white/30'
                            : 'text-white/80 hover:bg-[#052a54] hover:text-white'
                        }
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          icon={item.icon}
                          className={item.children?.some(child => isActive(child.href)) ? 'text-white' : 'text-white/70'}
                          size="sm"
                        />
                        {!collapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </div>
                      {!collapsed && (
                        <Icon
                          icon={isExpanded ? faChevronUp : faChevronDown}
                          className="text-white/70"
                          size="xs"
                        />
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {item.children?.map((child, childIndex) => {
                          const childActive = isActive(child.href);
                          return (
                            <li key={childIndex}>
                              <Link
                                href={child.href || '#'}
                                onClick={onClose}
                                className={`
                                  flex items-center gap-3 px-4 py-2
                                  transition-all duration-200
                                  ${
                                    childActive
                                      ? 'bg-[#052a54] text-white border-l-2 border-white/30'
                                      : 'text-white/70 hover:bg-[#052a54] hover:text-white'
                                  }
                                `}
                              >
                                <Icon
                                  icon={child.icon}
                                  className={childActive ? 'text-white' : 'text-white/70'}
                                  size="xs"
                                />
                                <span className="text-sm">{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={index}>
                  <Link
                    href={item.href || '#'}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3
                      transition-all duration-200
                      ${collapsed ? 'justify-center' : ''}
                      ${
                        active
                          ? 'bg-[#052a54] text-white border-l-4 border-white/30'
                          : 'text-white/80 hover:bg-[#052a54] hover:text-white'
                      }
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      icon={item.icon}
                      className={active ? 'text-white' : 'text-white/70'}
                      size="sm"
                    />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#052a54] flex-shrink-0">
          <Link
            href="/"
            className={`
              flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Back to Website' : undefined}
          >
            {!collapsed && <span>← Back to Website</span>}
            {collapsed && <Icon icon={faChevronLeft} />}
          </Link>
        </div>
      </aside>
    </>
  );
}

