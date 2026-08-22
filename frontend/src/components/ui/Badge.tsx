import React from 'react';
import { clsx } from 'clsx';
import { getStatusBadgeClass } from '../../lib/formatters';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate' | 'success' | 'danger' | 'warning' | 'default' | 'auto';
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'auto',
  status,
  size = 'md',
  className,
  dot = false,
}) => {
  let badgeStyle = '';

  if (status && variant === 'auto') {
    badgeStyle = getStatusBadgeClass(status);
  } else {
    switch (variant) {
      case 'emerald':
      case 'success':
        badgeStyle = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
        break;
      case 'amber':
      case 'warning':
        badgeStyle = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
        break;
      case 'blue':
        badgeStyle = 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
        break;
      case 'purple':
        badgeStyle = 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
        break;
      case 'rose':
      case 'danger':
        badgeStyle = 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
        break;
      default:
        badgeStyle = 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  }

  const sizeStyle =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider',
        sizeStyle,
        badgeStyle,
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};
