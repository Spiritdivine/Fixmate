import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
  
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
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-emerald-700" />
            <span>Notifications Center</span>
          </h1>
          <p className="text-sm text-slate-500">
            Real-time updates on proposals, milestone submissions, and escrow movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
          >
            Mark All Read
          </button>
          <button
            onClick={() => clearReadMutation.mutate()}
            disabled={clearReadMutation.isPending}
            className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold text-slate-600 transition-all"
          >
            Clear Read
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            !filterUnread
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            filterUnread
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 bg-white rounded-[24px] border border-slate-200/80 animate-pulse h-24 shadow-sm" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 rounded-[24px] bg-white">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No notifications
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You&apos;re completely up to date! New bids and milestone submissions will notify you here.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 sm:p-6 rounded-[24px] border transition-all flex items-start justify-between gap-5 ${
                !notif.isRead
                  ? 'border-emerald-500/50 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200/80 bg-white shadow-sm'
              }`}
            >
              <div
                onClick={() => {
                  if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                  if (notif.actionUrl) navigate(notif.actionUrl);
                }}
                className="flex-1 cursor-pointer space-y-1.5 min-w-0"
              >
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    {notif.title}
                  </h3>
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 ring-4 ring-emerald-100" />
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {notif.body}
                </p>

                <p className="text-[11px] text-slate-400 font-medium">
                  {formatDate(notif.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pt-1">
                {notif.actionUrl && (
                  <button
                    onClick={() => {
                      if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                      navigate(notif.actionUrl!);
                    }}
                    className="p-2 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                    title="Go to Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotificationMutation.mutate(notif.id)}
                  className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
