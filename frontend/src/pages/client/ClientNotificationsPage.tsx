import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Notification, ApiResponse } from '../../types';
import { formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const ClientNotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterUnread, setFilterUnread] = useState(false);

  // 1. Fetch Notifications
  const { data: notificationsData = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['client-notifications-list', filterUnread],
    queryFn: async () => {
      const url = filterUnread ? '/notifications?unreadOnly=true' : '/notifications';
      const { data } = await apiClient.get<ApiResponse<Notification[] | { notifications: Notification[] }>>(url);
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.notifications) || [];
    },
  });

  // 2. Mark All as Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications-list'] });
    },
  });

  // 3. Mark Single as Read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications-list'] });
    },
  });

  // 4. Delete Notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications-list'] });
    },
  });

  // 5. Clear All Read
  const clearReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete('/notifications');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notifications-list'] });
    },
  });

  const notifications = notificationsData || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-500" />
            <span>Notifications Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time updates on proposals, milestone submissions, and escrow movements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Mark All Read
          </button>
          <button
            onClick={() => clearReadMutation.mutate()}
            disabled={clearReadMutation.isPending}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
          >
            Clear Read
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
            !filterUnread
              ? 'bg-sky-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
            filterUnread
              ? 'bg-sky-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4 border-slate-200 dark:border-slate-800 animate-pulse h-20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Bell className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No notifications
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You&apos;re completely up to date! New bids and milestone submissions will notify you here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 border transition-all flex items-start justify-between gap-4 ${
                !notif.isRead
                  ? 'border-sky-500/50 bg-sky-50/30 dark:bg-sky-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div
                onClick={() => {
                  if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                  if (notif.actionUrl) navigate(notif.actionUrl);
                }}
                className="flex-1 cursor-pointer space-y-1 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {notif.title}
                  </h3>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {notif.body}
                </p>

                <p className="text-[10px] text-slate-400">
                  {formatDate(notif.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0 pt-1">
                {notif.actionUrl && (
                  <button
                    onClick={() => {
                      if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                      navigate(notif.actionUrl!);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600"
                    title="Go to Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotificationMutation.mutate(notif.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                  title="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
