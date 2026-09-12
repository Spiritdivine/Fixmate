import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number; // percentage, positive for increase, negative for decrease
  trendLabel?: string;
  variant?: 'primary' | 'default';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendLabel = 'from last month',
  variant = 'default',
  subtitle
}) => {
  const isPrimary = variant === 'primary';
  const isPositive = trend && trend > 0;

  return (
    <div
      className={clsx(
        'p-5 md:p-6 rounded-[24px] flex flex-col justify-between h-full min-h-[170px]',
        isPrimary 
          ? 'bg-[#186644] text-white shadow-md' 
          : 'bg-white text-slate-900 shadow-sm'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={clsx("text-base font-semibold", isPrimary ? 'text-emerald-50' : 'text-slate-800')}>
          {title}
        </h3>
        <button 
          className={clsx(
            "p-2 rounded-full flex items-center justify-center transition-colors",
            isPrimary 
              ? 'bg-white text-slate-900 hover:bg-slate-100' 
              : 'bg-white hover:bg-slate-50 text-slate-700'
          )}
        >
          <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      <div>
        <div className="text-[40px] leading-none font-bold tracking-tight mb-4">
          {value}
        </div>
        
        {trend !== undefined ? (
          <div className="flex items-center gap-2 text-xs">
            <span 
              className={clsx(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                isPrimary
                  ? 'bg-white/20 text-white'
                  : isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-slate-100 text-slate-500 '
              )}
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}
            </span>
            <span className={isPrimary ? 'text-emerald-100/90' : 'text-slate-400 font-medium'}>
              {isPositive ? 'Increased' : 'Decreased'} {trendLabel}
            </span>
          </div>
        ) : (
          subtitle && (
            <div className={clsx("text-xs font-medium", isPrimary ? 'text-emerald-100/90' : 'text-slate-400')}>
              {subtitle}
            </div>
          )
        )}
      </div>
    </div>
  );
};
