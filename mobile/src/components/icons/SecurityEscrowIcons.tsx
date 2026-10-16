import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { FIXMATE_ICON_DEFAULTS, FixmateIconProps } from './FixmateIcon';

/**
 * Fixmate Hybrid Icon System: Geometric Solid + Technical Outline
 * Used specifically for:
 * - Smart-contract escrow & locked balances
 * - Payment milestones & release states
 * - Cryptographic verification & identity assurance
 * - Technical inspection records & milestone history
 */

// 1. SMART CONTRACT ESCROW: Architectural shield with solid geometric lock core
export const SmartEscrowShieldIcon: React.FC<FixmateIconProps> = ({
  size = FIXMATE_ICON_DEFAULTS.size,
  color = FIXMATE_ICON_DEFAULTS.primaryColor,
  strokeWidth = FIXMATE_ICON_DEFAULTS.strokeWidth,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Architectural shield contour */}
    <Path
      d="M12 2L4 5.5V11C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11V5.5L12 2Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Geometric solid lock core */}
    <Rect
      x="9"
      y="11.5"
      width="6"
      height="5"
      rx="1.2"
      fill={colors.icons.accent}
      stroke={color}
      strokeWidth={strokeWidth * 0.8}
    />
    {/* Lock shackle */}
    <Path
      d="M10 11.5V9.5C10 8.4 10.9 7.5 12 7.5C13.1 7.5 14 8.4 14 9.5V11.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Solid center keyhole dot */}
    <Circle cx="12" cy="14" r="0.8" fill="#FFFFFF" />
  </Svg>
);

// 2. CRYPTOGRAPHIC VAULT: Engineered safe with dual-layer security dial
export const CryptographicVaultIcon: React.FC<FixmateIconProps> = ({
  size = FIXMATE_ICON_DEFAULTS.size,
  color = FIXMATE_ICON_DEFAULTS.primaryColor,
  strokeWidth = FIXMATE_ICON_DEFAULTS.strokeWidth,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Heavy vault safe outer housing */}
    <Rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="3.5"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Dial ring */}
    <Circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={strokeWidth} />
    {/* Solid geometric center rotor */}
    <Circle cx="12" cy="12" r="2" fill={colors.icons.accent} />
    {/* Locking bolt crosshairs */}
    <Line x1="12" y1="4" x2="12" y2="6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="17.5" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="3" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="18.5" y1="12" x2="21" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// 3. WORK EVIDENCE VIEWFINDER: Technical blueprint frame with evidence sensor
export const WorkEvidenceAuditIcon: React.FC<FixmateIconProps> = ({
  size = FIXMATE_ICON_DEFAULTS.size,
  color = FIXMATE_ICON_DEFAULTS.primaryColor,
  strokeWidth = FIXMATE_ICON_DEFAULTS.strokeWidth,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Viewfinder corner brackets */}
    <Path
      d="M6 3H3V6M18 3H21V6M21 18V21H18M3 18V21H6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Inner camera body */}
    <Rect
      x="5.5"
      y="6.5"
      width="13"
      height="11"
      rx="2"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    {/* Lens iris with solid accent center */}
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="1.2" fill={colors.icons.accent} />
    <Circle cx="16" cy="9" r="0.8" fill={color} />
  </Svg>
);

// 4. MILESTONE ROUTE NODE: Milestone progression checkpoint
export const MilestoneRouteNodeIcon: React.FC<FixmateIconProps> = ({
  size = FIXMATE_ICON_DEFAULTS.size,
  color = FIXMATE_ICON_DEFAULTS.primaryColor,
  strokeWidth = FIXMATE_ICON_DEFAULTS.strokeWidth,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Route path vector */}
    <Path
      d="M4 18C8 18 8 6 12 6C16 6 16 18 20 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Origin node */}
    <Circle cx="4" cy="18" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    {/* Active Milestone node with solid emerald fill */}
    <Circle cx="12" cy="6" r="3" fill={colors.icons.accent} stroke={color} strokeWidth={strokeWidth * 0.8} />
    {/* Target destination node */}
    <Circle cx="20" cy="18" r="2.2" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);
