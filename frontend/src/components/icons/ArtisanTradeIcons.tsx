import React from 'react';
import { clsx } from 'clsx';
import { FIXMATE_ICON_TOKENS } from './FixmateIconTokens';

export interface CraftIconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const DEFAULT_PROPS = {
  size: FIXMATE_ICON_TOKENS.sizes.md,
  color: FIXMATE_ICON_TOKENS.colors.primary,
  strokeWidth: FIXMATE_ICON_TOKENS.strokeWeight,
};

// 1. TAILORING: Precision dressmaking shears with pivot ring and calibrated cutting blade
export const TailoringIcon: React.FC<CraftIconProps> = ({
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
    {/* Left handle */}
    <circle cx="6" cy="18" r="3" stroke={color} strokeWidth={strokeWidth} />
    {/* Right handle */}
    <circle cx="18" cy="18" r="3" stroke={color} strokeWidth={strokeWidth} />
    {/* Left blade extending to top right */}
    <path
      d="M8.2 15.8L20 4M20 4L16 4M20 4L20 8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right blade extending to top left */}
    <path
      d="M15.8 15.8L4 4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Engineered pivot screw */}
    <circle cx="12" cy="12" r="1.2" fill={color} />
  </svg>
);

// 2. POTTERY: Architectural terracotta vessel / sculpted amphora silhouette
export const PotteryIcon: React.FC<CraftIconProps> = ({
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
    {/* Vessel rim */}
    <line x1="8" y1="3" x2="16" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    {/* Slender neck into balanced bulbous belly and sturdy base */}
    <path
      d="M9 3.5V6C9 7.5 5 10 5 14C5 18 8 21 12 21C16 21 19 18 19 14C19 10 15 7.5 15 6V3.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Subtle throwing groove ring */}
    <path
      d="M8.5 14C10 15 14 15 15.5 14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Ceramic base support */}
    <line x1="9.5" y1="21" x2="14.5" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

// 3. ELECTRICAL: Technical circuit impulse with dual terminal nodes
export const ElectricalIcon: React.FC<CraftIconProps> = ({
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
    {/* Angular energetic spark path */}
    <path
      d="M13 2.5L4.5 13H11.5L10.5 21.5L19.5 10.5H12.5L13 2.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Calibrated terminal dots */}
    <circle cx="3.5" cy="5.5" r="1.2" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="20.5" cy="18.5" r="1.2" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);

// 4. HAIR BRAIDING: Geometric sectioning comb and interlocked weave motif
export const HairBraidingIcon: React.FC<CraftIconProps> = ({
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
    {/* Stylized geometric braid strands */}
    <path
      d="M8 3C11 6 11 8 8 11C11 14 11 16 8 19M16 3C13 6 13 8 16 11C13 14 13 16 16 19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7C14 9 14 11 12 13C10 15 10 17 12 19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Base precision tie */}
    <line x1="7" y1="21" x2="17" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

// 5. CARPENTRY: Architectural joiner's try-square & handsaw profile
export const CarpentryIcon: React.FC<CraftIconProps> = ({
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
    {/* L-shaped engineer's square */}
    <path
      d="M4 20V4H10V8H18V14H10V20H4Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Calibration notch marks */}
    <line x1="4" y1="8" x2="7" y2="8" stroke={color} strokeWidth={strokeWidth} />
    <line x1="4" y1="12" x2="7" y2="12" stroke={color} strokeWidth={strokeWidth} />
    <line x1="4" y1="16" x2="7" y2="16" stroke={color} strokeWidth={strokeWidth} />
    <line x1="14" y1="8" x2="14" y2="11" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);

// 6. BEADWORK: Precision geometric threaded beads silhouette
export const BeadworkIcon: React.FC<CraftIconProps> = ({
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
    {/* Thread loop */}
    <path
      d="M4 12C4 7 8 3 12 3C16 3 20 7 20 12C20 17 16 21 12 21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray="2 3"
      strokeLinecap="round"
    />
    {/* Faceted geometric bead gems */}
    <circle cx="12" cy="4" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="19" cy="9" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="19" cy="15" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="12" cy="20" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="5" cy="15" r="2.2" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="5" cy="9" r="2.2" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);

// 7. PLUMBING: Industrial pipe coupling with hex union & shut-off valve
export const PlumbingIcon: React.FC<CraftIconProps> = ({
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
    {/* Pipe run */}
    <path
      d="M3 14H8V20H16V14H21M3 10H8V4H16V10H21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Central hex valve coupling */}
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <path d="M12 10.5V13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

// 8. SOLAR: Photovoltaic grid panel with directional radiant lines
export const SolarIcon: React.FC<CraftIconProps> = ({
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
    {/* Sun arc */}
    <circle cx="12" cy="6" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    <line x1="12" y1="1.5" x2="12" y2="2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="6.5" y1="4.5" x2="7.5" y2="5.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <line x1="17.5" y1="4.5" x2="16.5" y2="5.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    {/* Angled solar cell grid */}
    <polygon points="4,21 6.5,12 17.5,12 20,21" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <line x1="12" y1="12" x2="12" y2="21" stroke={color} strokeWidth={strokeWidth} />
    <line x1="5.2" y1="16.5" x2="18.8" y2="16.5" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);

// 9. PAINTING: Architect's clean-edge roller and surface reservoir
export const PaintingIcon: React.FC<CraftIconProps> = ({
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
    {/* Roller sleeve */}
    <rect x="4" y="3" width="16" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
    {/* Steel handle armature */}
    <path
      d="M20 6H21.5C22.3 6 23 6.7 23 7.5V12C23 12.8 22.3 13.5 21.5 13.5H13V17"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Ergonomic handle grip */}
    <rect x="11" y="17" width="4" height="6" rx="1" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);

// 10. AC REPAIR: Dual airflow compressor turbine & temperature vane
export const AcRepairIcon: React.FC<CraftIconProps> = ({
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
    {/* Central turbine core */}
    <circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    {/* 4 Engineered spiral blades */}
    <path
      d="M12 9.5C12 5 15 3 17 4C16 6 15 9.5 12 9.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 12C19 12 21 15 20 17C18 16 14.5 15 14.5 12Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 14.5C12 19 9 21 7 20C8 18 9 14.5 12 14.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 12C5 12 3 9 4 7C6 8 9.5 9 9.5 12Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Universal ArtisanTradeIcon dispatcher
 * Matches category name / slug to the precise architectural craft silhouette
 */
interface ArtisanTradeIconDispatcherProps extends CraftIconProps {
  trade: string;
}

export const ArtisanTradeIcon: React.FC<ArtisanTradeIconDispatcherProps> = ({
  trade,
  size,
  color,
  strokeWidth,
  className,
}) => {
  const normalized = (trade || '').toLowerCase();

  if (normalized.includes('tailor') || normalized.includes('fashion') || normalized.includes('cloth')) {
    return <TailoringIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('potter') || normalized.includes('ceramic')) {
    return <PotteryIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('electr') || normalized.includes('wir') || normalized.includes('power')) {
    return <ElectricalIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('hair') || normalized.includes('braid') || normalized.includes('salon')) {
    return <HairBraidingIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('carpent') || normalized.includes('wood') || normalized.includes('cabinet')) {
    return <CarpentryIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('bead') || normalized.includes('jewel') || normalized.includes('craft')) {
    return <BeadworkIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('plumb') || normalized.includes('pipe')) {
    return <PlumbingIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('solar') || normalized.includes('invert') || normalized.includes('clean energy')) {
    return <SolarIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('paint') || normalized.includes('decor')) {
    return <PaintingIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }
  if (normalized.includes('ac') || normalized.includes('hvac') || normalized.includes('cool') || normalized.includes('air')) {
    return <AcRepairIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
  }

  // Fallback: Carpentry tool silhouette
  return <CarpentryIcon size={size} color={color} strokeWidth={strokeWidth} className={className} />;
};
