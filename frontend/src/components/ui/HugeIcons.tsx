import React from 'react';

interface HugeIconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
}

// --------------------------------------------------------------------------
// 1. TRADES & SKILLS ICONS (HUGEICONS STYLE - RICH, DISTINCT, NON-GENERIC)
// --------------------------------------------------------------------------

// Solar & Clean Energy: Distinct solar cell grid with sun rays and energy arcs
export const SolarEnergyHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Sun arc */}
    <circle cx="12" cy="7" r="3" stroke="currentColor" />
    <path d="M12 2V3M5.6 4.4L6.4 5.2M18.4 4.4L17.6 5.2M2 9H3M21 9H22" stroke="currentColor" />
    {/* Solar panel grid with 3D perspective */}
    <path d="M4 14L6 21H18L20 14H4Z" stroke="currentColor" />
    <path d="M12 14V21" stroke="currentColor" />
    <path d="M5 17.5H19" stroke="currentColor" />
  </svg>
);

// Electrical Engineering: Power substation / circuit spark with terminal nodes
export const ElectricalHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" stroke="currentColor" />
    <circle cx="4" cy="4" r="1.5" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
    <circle cx="20" cy="20" r="1.5" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
    <path d="M5.5 5.5L8 8" stroke="currentColor" strokeDasharray="1 2" />
    <path d="M16 16L18.5 18.5" stroke="currentColor" strokeDasharray="1 2" />
  </svg>
);

// Precision Plumbing: Industrial pipe valve & pressure flow coupling
export const PlumbingHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Pipe run */}
    <path d="M3 15H9V21H15V15H21" stroke="currentColor" />
    <path d="M3 9H9V3H15V9H21" stroke="currentColor" />
    {/* Central coupling / meter */}
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" />
    <path d="M12 10.5V12L13.5 13.5" stroke="currentColor" />
    <path d="M2 15V9" stroke="currentColor" />
    <path d="M22 15V9" stroke="currentColor" />
  </svg>
);

// Carpentry & Cabinetry: Hand plane & precision timber joints
export const CarpentryHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Woodworking hand plane body */}
    <path d="M3 18H20C21.1 18 22 17.1 22 16V14C22 12.9 21.1 12 20 12H17L14 7H8L9 12H4C2.9 12 2 12.9 2 14V16C2 17.1 2.9 18 3 18Z" stroke="currentColor" />
    {/* Angled cutter blade */}
    <path d="M11 6L14 12" stroke="currentColor" strokeWidth={strokeWidth + 0.4} />
    {/* Front knob and rear handle */}
    <circle cx="6" cy="10" r="1.5" stroke="currentColor" />
    <path d="M18 10C18 9 18.5 8 19.5 8" stroke="currentColor" />
    {/* Wood shaving curl */}
    <path d="M12 4C13.5 4 14 5 13.5 6" stroke="currentColor" />
  </svg>
);

// Masonry & Precision Tiling: Brick bond with mason trowel
export const MasonryHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Brickwork grid */}
    <rect x="3" y="12" width="18" height="9" rx="1.5" stroke="currentColor" />
    <path d="M3 16.5H21" stroke="currentColor" />
    <path d="M9 12V16.5" stroke="currentColor" />
    <path d="M15 12V16.5" stroke="currentColor" />
    <path d="M12 16.5V21" stroke="currentColor" />
    {/* Mason trowel */}
    <path d="M12 3L16.5 7.5L12 9.5L7.5 7.5L12 3Z" stroke="currentColor" />
    <path d="M12 9.5V11.5" stroke="currentColor" />
  </svg>
);

// Welding & Metal Fabrication: Torch flame & protective arc shield
export const WeldingHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Welding torch nozzle */}
    <path d="M5 19L11 13" stroke="currentColor" />
    <path d="M4 20L3 21" stroke="currentColor" />
    <path d="M10 12L13 15" stroke="currentColor" />
    <rect x="10" y="11" width="3" height="4" transform="rotate(-45 10 11)" stroke="currentColor" />
    {/* Plasma arc / sparks */}
    <path d="M15 9L18 6M18 12L21 11M14 5L15 2M19 8L22 7" stroke="currentColor" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
  </svg>
);

// --------------------------------------------------------------------------
// 2. TRUST & SECURITY PROTOCOL ICONS
// --------------------------------------------------------------------------

// Biometric & NIN Identity Verification: Smart card + ID chip + biometric shield
export const IdentityAuditHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" />
    <circle cx="9" cy="10" r="2.5" stroke="currentColor" />
    <path d="M5.5 16C5.5 14.5 7 13.5 9 13.5C11 13.5 12.5 14.5 12.5 16" stroke="currentColor" />
    {/* Smart chip lines */}
    <path d="M15 8H18.5M15 12H18.5M15 16H17.5" stroke="currentColor" />
    {/* Verified seal */}
    <circle cx="19" cy="5" r="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" />
  </svg>
);

// Blockchain Smart Contract Escrow: Dual-token cryptographic vault
export const SmartContractVaultHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Vault shape */}
    <rect x="3" y="4" width="18" height="16" rx="4" stroke="currentColor" />
    {/* Vault dial & chain nodes */}
    <circle cx="12" cy="12" r="4" stroke="currentColor" />
    <circle cx="12" cy="12" r="1.5" stroke="currentColor" fill="currentColor" />
    <path d="M12 4V8M12 16V20M4 12H8M16 12H20" stroke="currentColor" />
    <path d="M17 7L18.5 5.5" stroke="currentColor" />
  </svg>
);

// Proof of Work Visual Audit: Lens viewfinder inspecting layered work frames
export const ProofOfWorkAuditHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Viewfinder brackets */}
    <path d="M5 8V5H8M16 5H19V8M19 16V19H16M8 19H5V16" stroke="currentColor" />
    {/* Image comparison frame */}
    <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" />
    <circle cx="10" cy="10" r="1" fill="currentColor" />
    <path d="M7 14L10 11L14 15" stroke="currentColor" />
    <path d="M12 13L14 11L17 14" stroke="currentColor" />
  </svg>
);

// Neutral Dispute Tribunal: Scales of justice with arbitral shield
export const DisputeTribunalHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Scale balance beam */}
    <path d="M12 3V21M7 6H17M12 3L9 6M12 3L15 6" stroke="currentColor" />
    {/* Left Pan */}
    <path d="M4 12L7 6L10 12H4Z" stroke="currentColor" />
    {/* Right Pan */}
    <path d="M14 12L17 6L20 12H14Z" stroke="currentColor" />
    {/* Base stand */}
    <path d="M8 21H16" stroke="currentColor" />
  </svg>
);

// --------------------------------------------------------------------------
// 3. PROTOCOL STEP ICONS (HOW IT WORKS)
// --------------------------------------------------------------------------

// 01: Scope & Agree: Architectural drafting contract & pen
export const ScopeContractHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" />
    <path d="M14 2V8H20" stroke="currentColor" />
    {/* Deliverable checklines */}
    <path d="M8 13H14M8 17H12" stroke="currentColor" />
    <circle cx="8" cy="13" r="0.5" fill="currentColor" />
    <circle cx="8" cy="17" r="0.5" fill="currentColor" />
  </svg>
);

// 02: Fund Escrow Safe: Secured vault lock with currency badge
export const FundEscrowHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="10" width="16" height="11" rx="3" stroke="currentColor" />
    <path d="M7 10V7C7 4.2 9.2 2 12 2C14.8 2 17 4.2 17 7V10" stroke="currentColor" />
    <circle cx="12" cy="15.5" r="1.5" stroke="currentColor" fill="currentColor" fillOpacity="0.3" />
    <path d="M12 17V18.5" stroke="currentColor" />
  </svg>
);

// 03: Visual Proof Inspection: Camera lens audit capture
export const VisualInspectionHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 7H16.5L15 4H9L7.5 7H4C2.9 7 2 7.9 2 9V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V9C22 7.9 21.1 7 20 7Z" stroke="currentColor" />
    <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" />
    <path d="M17 10H17.5" stroke="currentColor" strokeWidth={strokeWidth + 0.5} />
  </svg>
);

// 04: Instant Release: Lightning payout token
export const InstantSettlementHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" />
    <path d="M13 6L8.5 12.5H13L11 18L16.5 10.5H12L13 6Z" stroke="currentColor" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

// --------------------------------------------------------------------------
// 4. GENERAL ACCENT ICONS
// --------------------------------------------------------------------------

export const ShieldCheckHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L4 5.5V11.5C4 16.5 7.4 21.1 12 22C16.6 21.1 20 16.5 20 11.5V5.5L12 2Z" stroke="currentColor" />
    <path d="M8.5 11.5L11 14L15.5 9.5" stroke="currentColor" strokeWidth={strokeWidth + 0.3} />
  </svg>
);

export const CertifiedBadgeHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L15 5H19V9L22 12L19 15V19H15L12 22L9 19H5V15L2 12L5 9V5H9L12 2Z" stroke="currentColor" />
    <path d="M9 12L11 14L15 10" stroke="currentColor" />
  </svg>
);

// --------------------------------------------------------------------------
// 5. ROLE, PAYMENT & PLATFORM HUGEICONS (DISTINCT & NON-GENERIC)
// --------------------------------------------------------------------------

// Client / Property Owner: Modern architectural builder / homeowner badge
export const ClientProfileHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 21V9.5L12 3L21 9.5V21H15V14H9V21H3Z" stroke="currentColor" />
    <circle cx="12" cy="9.5" r="2" stroke="currentColor" />
    <path d="M9 21V15C9 14.2 9.7 13.5 10.5 13.5H13.5C14.3 13.5 15 14.2 15 15V21" stroke="currentColor" />
  </svg>
);

// Master Artisan Craftsman: Protective helmet + precision caliper / tool crown
export const ArtisanCraftsmanHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Hard hat dome */}
    <path d="M4 14C4 9.58 7.58 6 12 6C16.42 6 20 9.58 20 14" stroke="currentColor" />
    {/* Central reinforced rib */}
    <path d="M12 2V6M12 6V14" stroke="currentColor" />
    {/* Helmet brim */}
    <path d="M2 14H22C22 15.1 21.1 16 20 16H4C2.9 16 2 15.1 2 14Z" stroke="currentColor" />
    {/* Suspension harness under */}
    <path d="M6 16V18C6 19.5 8 21 12 21C16 21 18 19.5 18 18V16" stroke="currentColor" strokeDasharray="2 2" />
  </svg>
);

// Paystack Contactless Smart Card: Metallic chip + antenna waves
export const CreditCardHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" />
    <path d="M2 10H22" stroke="currentColor" />
    {/* EMV Microchip */}
    <rect x="5" y="13" width="4" height="3" rx="0.75" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
    {/* Contactless waves */}
    <path d="M16 13C16.8 13.5 16.8 14.5 16 15" stroke="currentColor" />
    <path d="M18 12C19.5 13 19.5 15 18 16" stroke="currentColor" />
  </svg>
);

// Monad Token / Web3 Vault: Monad multifaceted jewel geometry
export const MonadTokenHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" stroke="currentColor" />
    <path d="M12 22V12M12 12L20.5 7M12 12L3.5 7" stroke="currentColor" />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

// Escrow Vault Padlock: Industrial tumbler padlock with keyway
export const VaultLockHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" />
    <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke="currentColor" />
    <circle cx="12" cy="15.5" r="1.5" stroke="currentColor" fill="currentColor" />
    <path d="M12 17V18.5" stroke="currentColor" />
  </svg>
);

// Job Contract Docket: Legal specifications docket with wax stamp ribbon
export const JobContractDocketHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V7L15 2Z" stroke="currentColor" />
    <path d="M14 2V7H20" stroke="currentColor" />
    <path d="M8 11H13M8 15H11" stroke="currentColor" />
    {/* Wax stamp ribbon */}
    <circle cx="15" cy="16" r="2" stroke="currentColor" fill="currentColor" fillOpacity="0.25" />
    <path d="M14 18L13 21L15 20L17 21L16 18" stroke="currentColor" />
  </svg>
);

// Stacked Precision Currency Coins (Naira / Settled Value)
export const NairaCoinsHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" />
    <path d="M4 6V12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12V6" stroke="currentColor" />
    <path d="M4 12V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V12" stroke="currentColor" />
    {/* Subtle center denomination strike */}
    <line x1="12" y1="4.5" x2="12" y2="7.5" stroke="currentColor" />
  </svg>
);

// Sun Glyph (Day / Architectural Drafting Warmth)
export const SunHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" />
    <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" />
  </svg>
);

// Moon Glyph (Night / Monad Dark Mode)
export const MoonHugeIcon: React.FC<HugeIconProps> = ({ className = '', size = 24, strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79Z" stroke="currentColor" />
    <circle cx="15" cy="7" r="0.75" fill="currentColor" />
  </svg>
);
