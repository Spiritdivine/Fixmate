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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
          isSubscribed
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20'
        }`}
        title={isSubscribed ? 'Disable Push Alerts' : 'Enable Push Alerts'}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-3.5 h-3.5 fill-emerald-400/20" />
        ) : (
          <BellOff className="w-3.5 h-3.5" />
        )}
        <span>{isSubscribed ? 'Alerts Active' : 'Enable Alerts'}</span>
      </button>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-100 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isSubscribed
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Escrow & Job Push Notifications</span>
              {isSubscribed && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Receive real-time alerts when a client deposits escrow funds, releases milestone payouts,
              or sends a message—even when your browser is closed.
            </p>
            {message && (
              <p
                className={`text-xs mt-2 font-medium ${
                  isSubscribed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md active:scale-95 ${
            isSubscribed
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isSubscribed ? (
            <BellOff className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
          <span>{isSubscribed ? 'Disable' : 'Enable Alerts'}</span>
        </button>
      </div>
    </div>
  );
};
