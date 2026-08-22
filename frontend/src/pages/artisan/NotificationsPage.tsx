import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../lib/api-client';
import { formatDateTime, timeAgo } from '../../lib/formatters';
import { Notification } from '../../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterUnread, setFilterUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get(
        `/notifications?unreadOnly=${filterUnread ? 'true' : 'false'}`
      );
      setNotifications(data.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterUnread]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await apiClient.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      await apiClient.delete(`/notifications/${notifId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRead = async () => {
    try {
      await apiClient.delete('/notifications');
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time milestone releases, proposal acceptances, chat alerts, and payout confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark All Read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearRead}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Clear Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            !filterUnread
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterUnread
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="All caught up!"
          description="You have no notifications in this view."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) handleMarkAsRead(n.id);
                if (n.actionUrl) navigate(n.actionUrl);
              }}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                n.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                    n.isRead
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      : 'bg-sky-500/10 text-sky-500'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {n.body}
                  </p>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(n.createdAt)} •{' '}
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNotification(n.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
