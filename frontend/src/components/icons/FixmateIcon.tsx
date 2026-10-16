import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';
import { FIXMATE_ICON_TOKENS } from './FixmateIconTokens';

export interface FixmateIconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * FixmateIcon:
 * Enforces Fixmate architectural specifications on any Lucide icon:
 * - 1.85px stroke width (1.75–2px at 24×24px)
 * - Restrained geometry & softened corners
 * - Primary Forest Green #123F32 or Muted Olive #606C38
 */
export const FixmateIcon: React.FC<FixmateIconProps> = ({
  icon: IconComponent,
  size = FIXMATE_ICON_TOKENS.sizes.base,
  color,
  strokeWidth = FIXMATE_ICON_TOKENS.strokeWeight,
  className = '',
}) => {
  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={clsx('shrink-0 transition-colors duration-150', className)}
    />
  );
};

export interface IconContainerProps {
  children: React.ReactNode;
  variant?: 'cream' | 'sage' | 'forest' | 'emerald' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * IconContainer:
 * Important Fixmate rule: Do NOT put every icon inside a colored container!
 * Standalone icons are used for navigation and inline actions.
 * Containers are reserved for feature cards, important actions, and meaningful status indicators.
 */
export const IconContainer: React.FC<IconContainerProps> = ({
  children,
  variant = 'cream',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const variantClasses = {
    cream: 'bg-[#FEFAE0] border border-[#EBE4B6] text-[#123F32]',
    sage: 'bg-[#EAF2EC] border border-[#D0E2D5] text-[#123F32]',
    forest: 'bg-[#123F32] border border-[#0A241C] text-white',
    emerald: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]',
    ghost: 'bg-transparent border border-slate-200 text-[#123F32]',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center shrink-0 transition-transform duration-150',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};
