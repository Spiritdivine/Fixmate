import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = true,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border p-6 transition-all duration-200',
        glass ? 'glass-panel' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
        hoverable && 'hover:shadow-lg hover:border-sky-500/30 dark:hover:border-sky-500/30 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={clsx('flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={clsx('text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={clsx('text-xs text-slate-500 dark:text-slate-400 mt-0.5', className)} {...props}>
    {children}
  </p>
);
