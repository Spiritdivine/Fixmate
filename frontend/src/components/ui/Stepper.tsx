import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { MilestoneStatus } from '../../types';

export interface Step {
  title: string;
  description?: string;
  status?: MilestoneStatus;
  amount?: string | number;
  date?: string | null;
}

interface StepperProps {
  steps: Step[];
  currentStep?: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep = 1 }) => {
  const getStepVisual = (step: Step, idx: number) => {
    const stepNum = idx + 1;

    // If milestone status is provided
    if (step.status) {
      switch (step.status) {
        case 'RELEASED':
        case 'APPROVED':
          return {
            icon: <Check className="w-4 h-4" />,
            style: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 shadow-md',
            line: 'bg-emerald-500',
          };
        case 'SUBMITTED':
        case 'IN_PROGRESS':
        case 'FUNDED':
          return {
            icon: <Clock className="w-4 h-4 animate-pulse" />,
            style: 'bg-sky-600 text-white border-sky-600 shadow-sky-500/20 shadow-md',
            line: 'bg-sky-500',
          };
        case 'DISPUTED':
          return {
            icon: <AlertCircle className="w-4 h-4" />,
            style: 'bg-rose-600 text-white border-rose-600',
            line: 'bg-rose-500',
          };
        default:
          return {
            icon: <span className="w-2 h-2 rounded-full bg-slate-400" />,
            style: 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700',
            line: 'bg-slate-200 dark:bg-slate-800',
          };
      }
    }

    // Generic Wizard Stepper (1..N)
    if (stepNum < currentStep) {
      return {
        icon: <Check className="w-4 h-4" />,
        style: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
        line: 'bg-emerald-500',
      };
    } else if (stepNum === currentStep) {
      return {
        icon: <span className="text-xs font-bold">{stepNum}</span>,
        style: 'bg-sky-600 text-white border-sky-600 shadow-sky-500/20 shadow-md ring-4 ring-sky-500/20',
        line: 'bg-slate-200 dark:bg-slate-800',
      };
    } else {
      return {
        icon: <span className="text-xs font-bold text-slate-400">{stepNum}</span>,
        style: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400',
        line: 'bg-slate-200 dark:bg-slate-800',
      };
    }
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const { icon, style, line } = getStepVisual(step, idx);
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center relative group">
                <div
                  className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 z-10',
                    style
                  )}
                >
                  {icon}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 max-w-[120px] truncate">
                      {step.description}
                    </p>
                  )}
                  {step.status && (
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-0.5">
                      {step.status.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className={clsx('flex-1 h-0.5 mx-2 -mt-6 transition-all duration-300', line)} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
