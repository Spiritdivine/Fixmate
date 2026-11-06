import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAiChatStore } from '../../stores/aiChatStore';

/**
 * Exact Vector Icons Extracted from the Design Specification
 */
const HomeIcon = ({ active }: { active: boolean }) => {
  const color = active ? '#0D3F2E' : '#2D3E4E';
  if (active) {
    // Solid / Filled silhouette with arched doorway cutout
    return (
      <svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.5L2.5 10.5C2.1 10.8 1.9 11.3 2.1 11.8C2.3 12.3 2.7 12.6 3.2 12.6H4V20C4 20.8 4.7 21.5 5.5 21.5H9C9.6 21.5 10 21.1 10 20.5V15.5C10 14.4 10.9 13.5 12 13.5C13.1 13.5 14 14.4 14 15.5V20.5C14 21.1 14.4 21.5 15 21.5H18.5C19.3 21.5 20 20.8 20 20V12.6H20.8C21.3 12.6 21.7 12.3 21.9 11.8C22.1 11.3 21.9 10.8 21.5 10.5L12 2.5Z"
        />
      </svg>
    );
  }
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
      <path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H15V15.5C15 14.7 14.3 14 13.5 14H10.5C9.7 14 9 14.7 9 15.5V21H4C3.4 21 3 20.6 3 20V10.5Z" />
    </svg>
  );
};

const JobsIcon = ({ active }: { active: boolean }) => {
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
      {/* Briefcase Handle */}
      <path d="M8.5 6V4C8.5 3.4 9 3 9.6 3H14.4C15 3 15.5 3.4 15.5 4V6" />
      {/* Body */}
      <rect x="2.5" y="6" width="19" height="14" rx="3" />
      {/* Seam line */}
      <path d="M2.5 12H21.5" />
      {/* Center clasp */}
      <rect x="10" y="10.5" width="4" height="3.5" rx="0.75" />
    </svg>
  );
};

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
      <path d="M19 4H5C3.9 4 3 4.9 3 6V15C3 16.1 3.9 17 5 17H6.5V20.5L10.5 17H19C20.1 17 21 16.1 21 15V6C21 4.9 20.1 4 19 4Z" />
    </svg>
  );
};

const WalletIcon = ({ active }: { active: boolean }) => {
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
      {/* Wallet body */}
      <path d="M3 8V18.5C3 19.9 4.1 21 5.5 21H18.5C19.9 21 21 19.9 21 18.5V8.5" />
      {/* Curved top flap */}
      <path d="M3 9.5L16 5.5C17.5 5 19.5 5.8 20.5 7.2L21 8" />
      {/* Side clasp tab */}
      <path d="M16 11H20.5C21.3 11 22 11.7 22 12.5V15.5C22 16.3 21.3 17 20.5 17H16V11Z" />
      <circle cx="18.5" cy="14" r="1.2" fill={color} />
    </svg>
  );
};

/**
 * High-Precision Brain AI Icon matching the reference image emblem
 */
const BrainAiIcon = () => {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 40 40"
      fill="none"
      stroke="#FFFFFF"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left hemisphere outer lobes */}
      <path
        d="M 19 9.5 C 17 5.5, 11 5, 8.5 8.5 C 5 12.5, 4 17, 7 20.5 C 3 23, 3 29, 6.5 32 C 4.5 35, 7.5 38.5, 12 37.5"
        strokeWidth={1.9}
      />
      {/* Left hemisphere inner sulci */}
      <path d="M 8.5 8.5 C 10.5 11, 14 11, 15 14" strokeWidth={1.7} />
      <path d="M 7 20.5 C 10.5 21.5, 13 24, 12 27" strokeWidth={1.7} />
      {/* Left bottom stem and loop */}
      <path
        d="M 14.5 33 V 36.5 C 14.5 37.8, 16.5 37.8, 16.5 36.5 V 32"
        strokeWidth={1.8}
      />

      {/* Right hemisphere outer lobes (mirror) */}
      <path
        d="M 21 9.5 C 23 5.5, 29 5, 31.5 8.5 C 35 12.5, 36 17, 33 20.5 C 37 23, 37 29, 33.5 32 C 35.5 35, 32.5 38.5, 28 37.5"
        strokeWidth={1.9}
      />
      {/* Right hemisphere inner sulci */}
      <path d="M 31.5 8.5 C 29.5 11, 26 11, 25 14" strokeWidth={1.7} />
      <path d="M 33 20.5 C 29.5 21.5, 27 24, 28 27" strokeWidth={1.7} />
      {/* Right bottom stem and loop */}
      <path
        d="M 25.5 33 V 36.5 C 25.5 37.8, 23.5 37.8, 23.5 36.5 V 32"
        strokeWidth={1.8}
      />

      {/* Center "AI" Letterforms */}
      {/* A */}
      <path d="M 14.8 25.5 L 18 16 L 21.2 25.5" strokeWidth={2.2} />
      <path d="M 16 22.5 H 20" strokeWidth={2} />
      {/* I */}
      <path d="M 24.5 16 V 25.5" strokeWidth={2.2} />
    </svg>
  );
};

export const ClientBottomBar: React.FC = () => {
  const location = useLocation();
  const { openChat } = useAiChatStore();
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
  const totalBarHeight = barHeight + crestRise; // Height of component area above safe area

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
  const isHomeActive =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/client' ||
    location.pathname.startsWith('/client/artisans') ||
    location.pathname.startsWith('/client/saved-artisans');

  const isJobsActive =
    location.pathname.startsWith('/client/jobs') ||
    location.pathname.startsWith('/client/contracts') ||
    location.pathname.startsWith('/client/proposals');

  const isMessagesActive = location.pathname.startsWith('/client/messages');

  const isWalletActive =
    location.pathname.startsWith('/client/wallet') ||
    location.pathname.startsWith('/client/disputes');

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
            {/* Emerald Gradient for AI Button */}
            <linearGradient id="webDockAiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="45%" stopColor="#047857" />
              <stop offset="100%" stopColor="#023A26" />
            </linearGradient>

            {/* Mint Radial Glow for AI Button */}
            <radialGradient id="webDockAiGlow" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#10B981" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </radialGradient>
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

          {/* Halo Glow behind AI button */}
          <circle
            cx={windowWidth / 2}
            cy={crestRise + barHeight / 2 - 2}
            r="38"
            fill="url(#webDockAiGlow)"
          />
        </svg>

        {/* 5-Item Navigation Row Overlay */}
        <div
          className="absolute inset-x-0 flex items-center justify-between px-2"
          style={{ top: 0, height: barHeight }}
        >
          {/* Tab 1: Home */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/client/dashboard"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center transition-all select-none',
                  isActive || isHomeActive
                    ? 'bg-[#E8F8F2] px-4 py-1.5 rounded-full'
                    : 'px-2 py-1 hover:opacity-80'
                )
              }
            >
              <HomeIcon active={isHomeActive} />
              <span
                className={clsx(
                  'text-[11px] mt-0.5 tracking-tight',
                  isHomeActive
                    ? 'font-bold text-[#0D3F2E]'
                    : 'font-semibold text-[#2D3E4E]'
                )}
              >
                Home
              </span>
            </NavLink>
          </div>

          {/* Tab 2: My Jobs */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/client/jobs"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center transition-all select-none',
                  isActive || isJobsActive
                    ? 'bg-[#E8F8F2] px-4 py-1.5 rounded-full'
                    : 'px-2 py-1 hover:opacity-80'
                )
              }
            >
              <JobsIcon active={isJobsActive} />
              <span
                className={clsx(
                  'text-[11px] mt-0.5 tracking-tight',
                  isJobsActive
                    ? 'font-bold text-[#0D3F2E]'
                    : 'font-semibold text-[#2D3E4E]'
                )}
              >
                My Jobs
              </span>
            </NavLink>
          </div>

          {/* Center Tab: AI Hero Button */}
          <div className="w-[68px] h-full flex items-center justify-center relative z-10">
            <button
              onClick={() => openChat()}
              type="button"
              className="w-[58px] h-[58px] rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-[0_4px_14px_rgba(4,120,87,0.35)] -translate-y-3.5 relative focus:outline-none"
              style={{
                background: 'linear-gradient(180deg, #059669 0%, #047857 45%, #023A26 100%)',
              }}
              title="Launch Oga John AI Assistant"
            >
              <BrainAiIcon />
            </button>
          </div>

          {/* Tab 4: Messages */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/client/messages"
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

          {/* Tab 5: Wallet */}
          <div className="flex-1 h-full flex items-center justify-center">
            <NavLink
              to="/client/wallet"
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center transition-all select-none',
                  isActive || isWalletActive
                    ? 'bg-[#E8F8F2] px-4 py-1.5 rounded-full'
                    : 'px-2 py-1 hover:opacity-80'
                )
              }
            >
              <WalletIcon active={isWalletActive} />
              <span
                className={clsx(
                  'text-[11px] mt-0.5 tracking-tight',
                  isWalletActive
                    ? 'font-bold text-[#0D3F2E]'
                    : 'font-semibold text-[#2D3E4E]'
                )}
              >
                Wallet
              </span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientBottomBar;
