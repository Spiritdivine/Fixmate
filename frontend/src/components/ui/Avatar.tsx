import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'Artisan',
  size = 'md',
  isOnline,
  className,
}) => {
  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative inline-block shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx(
            'rounded-full object-cover border border-slate-200 dark:border-slate-700',
            sizeStyles[size],
            className
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-semibold bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-xs',
            sizeStyles[size],
            className
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900',
            isOnline ? 'bg-emerald-500' : 'bg-slate-400',
            dotSizes[size]
          )}
        />
      )}
    </div>
  );
};
