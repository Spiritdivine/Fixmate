import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

/**
 * Exact Vector Icons for Artisan Bottom Navigation
 * Following reference image: Profile | Earnings | Radar/Jobs | My Tasks | Messages
 */

// Tab 1: Profile
const ProfileIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </svg>
  );
};

// Tab 2: Earnings
const EarningsIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Wallet Body */}
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      {/* Curved Pouch/Flap */}
      <path d="M16 8h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
      {/* Snap Clasp Dot */}
      <circle cx="18" cy="12" r="1.2" fill={color} />
    </svg>
  );
};

// Tab 3 (Center Hero Button): Radar Scanner Art
const RadarScannerArt = () => {
  return (
    <svg width={26} height={24} viewBox="0 0 28 26" fill="none">
      <g transform="translate(14, 12)">
        {/* Outer scanner ring */}
        <circle cx={0} cy={0} r={9} fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
        {/* Inner scanner ring */}
        <circle cx={0} cy={0} r={4.6} fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
        {/* Center pivot dot */}
        <circle cx={0} cy={0} r={1.6} fill="#FFFFFF" />
        {/* 45-degree scanner sweep ray */}
        <line
          x1={0}
          y1={0}
          x2={6.5}
          y2={-6.5}
          stroke="#FFFFFF"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

// Tab 4: My Tasks (Clipboard with Checkmark)
const MyTasksIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Board */}
      <rect x="4" y="4" width="16" height="17" rx="3" strokeWidth={2} />
      {/* Top Clip */}
      <path
        d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z"
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={active ? '#E8F8F2' : '#FFFFFF'}
      />
      {/* Checkmark */}
      <path
        d="M8.5 13l2.5 2.5 5-5"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Tab 5: Messages (Speech Bubble)
const MessagesIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.1-1.1L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5z" />
    </svg>
  );
};

export const ArtisanBottomBar: React.FC = () => {
  const location = useLocation();

  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const barHeight = 64; // Standard bottom nav height
  const crestRise = 20; // Rise of center contour hump
  const totalBarHeight = barHeight + crestRise;

  // Full-width SVG path with smooth center hump and top border stroke
  const { fillPath, strokePath } = useMemo(() => {
    const W = windowWidth;
    const Cx = W / 2;
    const crestWidth = 100;
    const xStart = Cx - crestWidth / 2;
    const xEnd = Cx + crestWidth / 2;
    const yTop = crestRise; // y = 20
    const yBot = totalBarHeight + 40; // Overfill downwards for iOS safe area
    const yPeak = 2; // Peak of the dome curve

    const cp1x = xStart + 22;
    const cp2x = Cx - 24;
    const cp3x = Cx + 24;
    const cp4x = xEnd - 22;

    const fill = `
      M 0 ${yTop}
      L ${xStart} ${yTop}
      C ${cp1x} ${yTop}, ${cp2x} ${yPeak}, ${Cx} ${yPeak}
      C ${cp3x} ${yPeak}, ${cp4x} ${yTop}, ${xEnd} ${yTop}
      L ${W} ${yTop}
      L ${W} ${yBot}
      L 0 ${yBot}
      Z
    `.trim();

    const stroke = `
      M 0 ${yTop}
      L ${xStart} ${yTop}
      C ${cp1x} ${yTop}, ${cp2x} ${yPeak}, ${Cx} ${yPeak}
      C ${cp3x} ${yPeak}, ${cp4x} ${yTop}, ${xEnd} ${yTop}
      L ${W} ${yTop}
    `.trim();

    return { fillPath: fill, strokePath: stroke };
  }, [windowWidth, crestRise, totalBarHeight]);

  // Route active checks
  const isProfileActive =
    location.pathname.startsWith('/artisan/profile') ||
    location.pathname.startsWith('/artisan/settings') ||
    location.pathname.startsWith('/artisan/kyc') ||
    location.pathname.startsWith('/artisan/reviews');

  const isEarningsActive =
    location.pathname.startsWith('/artisan/wallet') ||
    location.pathname.startsWith('/artisan/payouts');

  const isRadarJobsActive =
    location.pathname === '/artisan/dashboard' ||
    location.pathname === '/artisan' ||
    location.pathname === '/artisan/jobs' ||
    location.pathname.startsWith('/artisan/jobs/invitations');

  const isMyTasksActive =
    location.pathname.startsWith('/artisan/contracts') ||
    location.pathname.startsWith('/artisan/proposals') ||
    location.pathname.startsWith('/artisan/disputes');

  const isMessagesActive = location.pathname.startsWith('/artisan/messages');

  return (
    <div
      className="lg:hidden relative w-full shrink-0 z-30 select-none font-dashboard overflow-visible"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Container holding background SVG and overlaid tab items */}
      <div className="relative w-full overflow-visible" style={{ height: barHeight }}>
        {/* Full-width docked SVG with contoured hump protruding upward */}
        <svg
          width={windowWidth}
          height={totalBarHeight + 40}
          viewBox={`0 0 ${windowWidth} ${totalBarHeight + 40}`}
          className="absolute left-0 right-0 pointer-events-none drop-shadow-[0_-3px_8px_rgba(0,0,0,0.04)]"
          style={{ top: -crestRise }}
        >
          <defs>
            {/* Emerald Gradient for Radar Button */}
            <linearGradient id="webArtisanRadarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="45%" stopColor="#047857" />
              <stop offset="100%" stopColor="#023A26" />
            </linearGradient>

            {/* Mint Radial Glow behind center button */}
            <radialGradient id="webArtisanRadarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#10B981" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </radialGradient>

            {/* Top Glass Gloss Reflection */}
            <linearGradient id="webArtisanGlassGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.28} />
              <stop offset="65%" stopColor="#FFFFFF" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Full-width solid white body */}
          <path d={fillPath} fill="#FFFFFF" />

          {/* Continuous crisp top border contour from edge to edge */}
          <path
            d={strokePath}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
          />

          {/* Halo Glow behind center button */}
          <circle
            cx={windowWidth / 2}
            cy={crestRise + barHeight / 2 - 2}
            r="38"
            fill="url(#webArtisanRadarGlow)"
          />
        </svg>

        {/* 5-Item Navigation Row Overlay */}
        <div
          className="absolute inset-x-0 flex items-center justify-between px-2"
          style={{ top: 0, height: barHeight }}
        >
          {/* Tab 1: Profile */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/artisan/profile"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center transition-all select-none',
                  isActive || isProfileActive
                    ? 'bg-[#E8F8F2] px-4 py-1.5 rounded-full'
                    : 'px-2 py-1 hover:opacity-80'
                )
              }
            >
              <ProfileIcon active={isProfileActive} />
              <span
                className={clsx(
                  'text-[11px] mt-0.5 tracking-tight',
                  isProfileActive
                    ? 'font-bold text-[#0D3F2E]'
                    : 'font-semibold text-[#2D3E4E]'
                )}
              >
                Profile
              </span>
            </NavLink>
          </div>

          {/* Tab 2: Earnings */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/artisan/wallet"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center transition-all select-none',
                  isActive || isEarningsActive
                    ? 'bg-[#E8F8F2] px-4 py-1.5 rounded-full'
                    : 'px-2 py-1 hover:opacity-80'
                )
              }
            >
              <EarningsIcon active={isEarningsActive} />
              <span
                className={clsx(
                  'text-[11px] mt-0.5 tracking-tight',
                  isEarningsActive
                    ? 'font-bold text-[#0D3F2E]'
                    : 'font-semibold text-[#2D3E4E]'
                )}
              >
                Earnings
              </span>
            </NavLink>
          </div>

          {/* Center Tab: Radar/Jobs Hero Button */}
          <div className="w-[68px] h-full flex items-center justify-center relative z-10">
            <NavLink
              to="/artisan/dashboard"
              className="w-[58px] h-[58px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-[0_4px_14px_rgba(4,120,87,0.35)] -translate-y-3.5 relative focus:outline-none border border-emerald-400/40 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #059669 0%, #047857 45%, #023A26 100%)',
              }}
              title="Radar & Incoming Jobs Cockpit"
            >
              {/* Gloss Arch Overlay */}
              <div
                className="absolute inset-x-0 top-0 h-[26px] pointer-events-none rounded-t-full opacity-60"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
                }}
              />

              <RadarScannerArt />
              <span className="text-[8.5px] font-bold text-white tracking-tight -mt-0.5 select-none">
                Radar/Jobs
              </span>
            </NavLink>
          </div>

          {/* Tab 4: My Tasks */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/artisan/contracts"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center transition-all select-none',
                  isActive || isMyTasksActive
                    ? 'bg-[#E8F8F2] px-4 py-1.5 rounded-full'
                    : 'px-2 py-1 hover:opacity-80'
                )
              }
            >
              <MyTasksIcon active={isMyTasksActive} />
              <span
                className={clsx(
                  'text-[11px] mt-0.5 tracking-tight',
                  isMyTasksActive
                    ? 'font-bold text-[#0D3F2E]'
                    : 'font-semibold text-[#2D3E4E]'
                )}
              >
                My Tasks
              </span>
            </NavLink>
          </div>

          {/* Tab 5: Messages */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/artisan/messages"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center transition-all select-none',
                  isActive || isMessagesActive
                    ? 'bg-[#E8F8F2] px-4 py-1.5 rounded-full'
                    : 'px-2 py-1 hover:opacity-80'
                )
              }
            >
              <div className="relative flex items-center justify-center">
                <MessagesIcon active={isMessagesActive} />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#064E3B] text-white text-[9px] font-extrabold flex items-center justify-center border-1.5 border-white shadow-xs">
                  1
                </span>
              </div>
              <span
                className={clsx(
                  'text-[11px] mt-0.5 tracking-tight',
                  isMessagesActive
                    ? 'font-bold text-[#0D3F2E]'
                    : 'font-semibold text-[#2D3E4E]'
                )}
              >
                Messages
              </span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanBottomBar;

