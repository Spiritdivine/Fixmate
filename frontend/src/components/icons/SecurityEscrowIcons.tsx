import React from 'react';
import { clsx } from 'clsx';
import { FIXMATE_ICON_TOKENS } from './FixmateIconTokens';
import { CraftIconProps } from './ArtisanTradeIcons';

const DEFAULT_PROPS = {
  size: FIXMATE_ICON_TOKENS.sizes.md,
  color: FIXMATE_ICON_TOKENS.colors.primary,
  strokeWidth: FIXMATE_ICON_TOKENS.strokeWeight,
};

// 1. SMART CONTRACT ESCROW: Architectural shield with solid geometric lock core
export const SmartEscrowShieldIcon: React.FC<CraftIconProps> = ({
  size = DEFAULT_PROPS.size,
  color = DEFAULT_PROPS.color,
  strokeWidth = DEFAULT_PROPS.strokeWidth,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={clsx('shrink-0', className)}
    aria-hidden="true"
  >
    {/* Architectural shield contour */}
    <path
      d="M12 2L4 5.5V11C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11V5.5L12 2Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Geometric solid lock core */}
    <rect
      x="9"
      y="11.5"
      width="6"
      height="5"
      rx="1.2"
      fill={FIXMATE_ICON_TOKENS.colors.accent}
      stroke={color}
      strokeWidth={strokeWidth * 0.8}
    />
    {/* Lock shackle */}
    <path
      d="M10 11.5V9.5C10 8.4 10.9 7.5 12 7.5C13.1 7.5 14 8.4 14 9.5V11.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Solid center keyhole dot */}
    <circle cx="12" cy="14" r="0.8" fill="#FFFFFF" />
  </svg>
);

// 2. CRYPTOGRAPHIC VAULT: Engineered safe with dial rotor & blockchain nodes
export const CryptographicVaultIcon: React.FC<CraftIconProps> = ({
  size = DEFAULT_PROPS.size,
  color = DEFAULT_PROPS.color,
  strokeWidth = DEFAULT_PROPS.strokeWidth,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={clsx('shrink-0', className)}
    aria-hidden="true"
  >
    {/* Heavy vault safe outer housing */}
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="3.5"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Dial ring */}
    <circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={strokeWidth} />
    {/* Solid geometric center rotor */}
    <circle cx="12" cy="12" r="2" fill={FIXMATE_ICON_TOKENS.colors.accent} />
    {/* Locking bolt crosshairs */}
    <line x1="12" y1="4" x2="12" y2="6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="12" y1="17.5" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="3" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="18.5" y1="12" x2="21" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

// 3. WORK EVIDENCE AUDIT: Technical blueprint viewfinder frame with sensor
export const WorkEvidenceAuditIcon: React.FC<CraftIconProps> = ({
  size = DEFAULT_PROPS.size,
  color = DEFAULT_PROPS.color,
  strokeWidth = DEFAULT_PROPS.strokeWidth,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={clsx('shrink-0', className)}
    aria-hidden="true"
  >
    {/* Viewfinder corner brackets */}
    <path
      d="M6 3H3V6M18 3H21V6M21 18V21H18M3 18V21H6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Inner camera body */}
    <rect
      x="5.5"
      y="6.5"
      width="13"
      height="11"
      rx="2"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Lens iris with solid accent center */}
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="12" cy="12" r="1.2" fill={FIXMATE_ICON_TOKENS.colors.accent} />
    <circle cx="16" cy="9" r="0.8" fill={color} />
  </svg>
);

// 4. MILESTONE ROUTE NODE: Milestone progression checkpoint
export const MilestoneRouteNodeIcon: React.FC<CraftIconProps> = ({
  size = DEFAULT_PROPS.size,
  color = DEFAULT_PROPS.color,
  strokeWidth = DEFAULT_PROPS.strokeWidth,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={clsx('shrink-0', className)}
    aria-hidden="true"
  >
    {/* Route path vector */}
    <path
      d="M4 18C8 18 8 6 12 6C16 6 16 18 20 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Origin node */}
    <circle cx="4" cy="18" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    {/* Active Milestone node with solid emerald fill */}
    <circle cx="12" cy="6" r="3" fill={FIXMATE_ICON_TOKENS.colors.accent} stroke={color} strokeWidth={strokeWidth * 0.8} />
    {/* Target destination node */}
    <circle cx="20" cy="18" r="2.2" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);
