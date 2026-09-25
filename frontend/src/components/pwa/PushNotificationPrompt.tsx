import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getExistingPushSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '../../lib/pushNotifications';

interface PushNotificationPromptProps {
  compact?: boolean;
}

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  compact = false,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const sub = await getExistingPushSubscription();
        setIsSubscribed(Boolean(sub));
      }
    };

    checkSupport();
  }, []);

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    setIsLoading(true);
    setMessage(null);

    if (isSubscribed) {
      const res = await unsubscribeUserFromPush();
      if (res.success) {
        setIsSubscribed(false);
        setMessage('Push notifications disabled.');
      } else {
        setMessage(res.error || 'Failed to unsubscribe.');
      }
    } else {
      const res = await subscribeUserToPush();
      if (res.success) {
        setIsSubscribed(true);
        setMessage('Push notifications enabled successfully!');
      } else {
        setMessage(res.error || 'Permission denied or failed to enable.');
      }
    }

    setIsLoading(false);
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer active:scale-95 ${
          isSubscribed
            ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700'
            : 'bg-[#123E2A] text-white hover:bg-[#0E3222] shadow-sm'
        }`}
        title={isSubscribed ? 'Disable Push Alerts' : 'Enable Push Alerts'}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-3.5 h-3.5 text-[#123E2A] dark:text-emerald-400" />
        ) : (
          <BellOff className="w-3.5 h-3.5" />
        )}
        <span>{isSubscribed ? 'Alerts Active' : 'Enable Alerts'}</span>
      </button>
    );
  }

  return (
    <div 
      className="p-5 rounded-2xl bg-[#FAF7F0] dark:bg-[#141A16] border border-stone-200 dark:border-stone-800 text-[#141A16] dark:text-[#FAF7F0] shadow-sm"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-xl shrink-0 transition-colors ${
              isSubscribed
                ? 'bg-[#123E2A]/10 text-[#123E2A] dark:bg-[#123E2A]/30 dark:text-emerald-400 border border-[#123E2A]/20'
                : 'bg-stone-200/60 dark:bg-stone-800 text-[#141A16] dark:text-stone-300 border border-stone-300/80 dark:border-stone-700'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#141A16] dark:text-white tracking-[-0.02em]">
                Escrow & Job Lead Push Notifications
              </h4>
              {isSubscribed && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#123E2A]/10 text-[#123E2A] dark:text-emerald-400 border border-[#123E2A]/20">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            <p className="text-xs text-[#556259] dark:text-stone-400 mt-1 max-w-lg leading-relaxed font-normal">
              Receive real-time alerts when a client locks funds into escrow, releases milestone payouts, or posts matching trade jobs in your area.
            </p>
            {message && (
              <p
                className={`text-xs mt-2 font-medium ${
                  isSubscribed ? 'text-[#123E2A] dark:text-emerald-400' : 'text-[#BD5324] dark:text-[#E07A4B]'
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="self-end sm:self-auto shrink-0">
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition shadow-sm active:scale-95 cursor-pointer ${
              isSubscribed
                ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700'
                : 'bg-[#123E2A] hover:bg-[#0E3222] text-white shadow-md'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSubscribed ? (
              <BellOff className="w-3.5 h-3.5 text-stone-500" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
            <span>{isSubscribed ? 'Disable Alerts' : 'Enable Mobile Alerts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
