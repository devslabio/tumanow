'use client';

import { useState, useEffect } from 'react';
import { NotificationsAPI } from '@/lib/api';
import Icon, { 
  faBell, 
  faCheck, 
  faTrash,
  faFilter,
  faTimes,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Pagination, Button, ConfirmDialog } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

type NotificationType = 'ORDER_CREATED' | 'ORDER_APPROVED' | 'PAYMENT_RECEIVED' | 'ORDER_DELIVERED' | string;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('');
  const [readFilter, setReadFilter] = useState<boolean | ''>('');
  const [markingAll, setMarkingAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          limit: pageSize,
        };

        if (typeFilter) {
          params.type = typeFilter;
        }

        if (readFilter !== '') {
          params.read = readFilter;
        }

        const [notificationsResponse, unreadResponse] = await Promise.all([
          NotificationsAPI.getAll(params),
          NotificationsAPI.getUnreadCount(),
        ]);
        setNotifications(notificationsResponse.data || []);
        setTotal(notificationsResponse.meta?.total || 0);
        setUnreadCount(unreadResponse.unread_count || 0);
      } catch (error: any) {
        console.error('Failed to fetch notifications:', error);
        toast.error(error?.response?.data?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [page, pageSize, typeFilter, readFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read_at: new Date() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await NotificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date() })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async () => {
    if (!notificationToDelete) return;

    try {
      await NotificationsAPI.delete(notificationToDelete);
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
      setTotal(prev => prev - 1);
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
      toast.success('Notification deleted');
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const openDeleteDialog = (id: string) => {
    setNotificationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
          >
            {markingAll ? 'Marking...' : 'Mark All as Read'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as NotificationType | '');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              <option value="">All Types</option>
              <option value="ORDER_CREATED">Order Created</option>
              <option value="ORDER_APPROVED">Order Approved</option>
              <option value="PAYMENT_RECEIVED">Payment Received</option>
              <option value="ORDER_DELIVERED">Order Delivered</option>
            </select>
          </div>

          {/* Read Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={readFilter === '' ? '' : readFilter ? 'read' : 'unread'}
              onChange={(e) => {
                const value = e.target.value;
                setReadFilter(value === '' ? '' : value === 'read');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Loading notifications..." />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
          <Icon icon={faBell} className="text-gray-300 mx-auto mb-4" size="2x" />
          <p className="text-gray-500">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const isUnread = !notification.read_at;
            return (
              <div
                key={notification.id}
                className={`bg-white border rounded-sm p-4 ${
                  isUnread ? 'border-[#0b66c2] bg-[#0b66c2]/5' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                    isUnread ? 'bg-[#0b66c2]/10' : 'bg-gray-100'
                  }`}>
                    <Icon
                      icon={faBell}
                      className={isUnread ? 'text-[#0b66c2]' : 'text-gray-400'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {isUnread && (
                            <span className="w-2 h-2 bg-[#0b66c2] rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.created_at)}</span>
                          <span className="capitalize">{notification.type.replace(/_/g, ' ').toLowerCase()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-[#0b66c2] transition-colors"
                            title="Mark as read"
                          >
                            <Icon icon={faCheck} size="sm" />
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteDialog(notification.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-sm"
                          title="Delete"
                        >
                          <Icon icon={faTrash} size="sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setNotificationToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

