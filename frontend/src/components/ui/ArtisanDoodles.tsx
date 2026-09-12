import React from 'react';

export const ArtisanDoodles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      
      {/* Doodle 1: Hand-drawn Pipe Wrench & Water Drop (Plumbing) - Upper Mid-Left */}
      <div className="absolute top-[16%] left-[15%] opacity-20 dark:opacity-15 text-[#BD5324] transform -rotate-12 transition-transform hover:scale-105 duration-300">
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Wrench handle */}
          <path d="M 28 78 L 48 48 C 50 45 54 45 56 48 L 58 50 C 60 52 60 56 58 58 L 38 88 C 35 91 30 91 28 88 L 26 86 C 24 84 24 80 28 78 Z" />
          {/* Wrench head */}
          <path d="M 48 48 L 52 38 L 74 38 L 74 46 L 60 48" />
          {/* Adjustable jaw */}
          <path d="M 64 38 L 64 26 L 82 26 L 82 34 L 72 38" />
          {/* Adjustment knurl */}
          <line x1="56" y1="42" x2="60" y2="46" />
          <line x1="58" y1="40" x2="62" y2="44" />
          {/* Water drop */}
          <path d="M 82 50 C 82 54 78 57 75 57 C 72 57 68 54 75 46 C 82 54 82 54 82 50 Z" />
        </svg>
      </div>

      {/* Doodle 2: Hand-drawn Incandescent Filament Bulb & Circuit Waves (Electrical) - Upper Center-Right */}
      <div className="absolute top-[10%] right-[20%] opacity-20 dark:opacity-15 text-[#BD5324] transform rotate-8 transition-transform hover:scale-105 duration-300">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Bulb glass */}
          <path d="M 36 56 C 28 50 25 38 30 28 C 36 17 50 14 62 20 C 72 26 76 40 70 50 C 66 56 64 58 64 64 L 36 64 C 36 58 34 56 36 56 Z" />
          {/* Coiled filament */}
          <path d="M 44 64 L 44 42 L 48 38 L 52 42 L 56 38 L 56 64" />
          {/* Screw base */}
          <path d="M 38 68 L 62 68 M 40 73 L 60 73 M 44 78 L 56 78" />
          {/* Radiant spark rays */}
          <line x1="50" y1="8" x2="50" y2="3" />
          <line x1="20" y1="20" x2="15" y2="17" />
          <line x1="80" y1="20" x2="85" y2="17" />
        </svg>
      </div>

      {/* Doodle 3: Hand-drawn Architect Compass & Rule (Measurement & Design) - Upper Center */}
      <div className="absolute top-[4%] left-[46%] opacity-15 dark:opacity-10 text-[#BD5324] transform -rotate-6">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Hinge */}
          <circle cx="50" cy="22" r="6" />
          <circle cx="50" cy="22" r="2" fill="currentColor" />
          {/* Left leg */}
          <path d="M 46 26 L 24 82" />
          <path d="M 24 82 L 22 88" />
          {/* Right leg */}
          <path d="M 54 26 L 76 82" />
          {/* Measurement arc */}
          <path d="M 35 55 A 30 30 0 0 1 65 55" strokeDasharray="3 3" />
          {/* Center thumbscrew */}
          <line x1="32" y1="52" x2="68" y2="52" />
        </svg>
      </div>

      {/* Doodle 4: Hand-drawn Hand Saw & Dovetail Timber Joint (Carpentry) - Lower Mid-Left */}
      <div className="absolute bottom-[28%] left-[10%] opacity-20 dark:opacity-15 text-[#BD5324] transform rotate-15">
        <svg width="72" height="72" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Saw blade with teeth */}
          <path d="M 32 38 L 86 60 L 84 65 L 78 63 L 76 68 L 70 66 L 68 71 L 62 69 L 60 74 L 54 72 L 52 77 L 46 75 L 44 80 L 30 74 Z" />
          {/* Wooden handle */}
          <path d="M 32 38 C 24 38 16 46 16 56 C 16 66 22 74 30 74 Z" />
          <path d="M 22 52 C 22 48 25 46 28 46 L 28 66 C 25 66 22 64 22 60 Z" />
          {/* Wood grain shavings */}
          <path d="M 88 70 Q 94 72 92 78 Q 90 82 85 80" />
        </svg>
      </div>

      {/* Doodle 5: Hand-drawn Brickwork & Mason Trowel (Masonry & Tiling) - Lower Mid-Right */}
      <div className="absolute bottom-[24%] right-[12%] opacity-20 dark:opacity-15 text-[#BD5324] transform -rotate-10">
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* 3 Offset Bricks */}
          <rect x="20" y="55" width="28" height="14" rx="2" />
          <rect x="52" y="55" width="28" height="14" rx="2" />
          <rect x="36" y="72" width="28" height="14" rx="2" />
          {/* Mortar line accent */}
          <line x1="20" y1="70" x2="80" y2="70" strokeDasharray="2 3" />
          {/* Diamond Trowel */}
          <path d="M 48 20 L 64 36 L 48 50 L 34 36 Z" />
          {/* Trowel shank & wooden handle */}
          <path d="M 48 20 L 48 10 L 42 10" />
          <rect x="28" y="7" width="14" height="6" rx="2" />
        </svg>
      </div>

      {/* Doodle 6: Hand-drawn Solar Panel Array & Radiant Sun (Solar Energy) - Center Bottom Background */}
      <div className="absolute bottom-[6%] left-[48%] opacity-15 dark:opacity-10 text-[#BD5324] transform rotate-3">
        <svg width="66" height="66" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Sun */}
          <circle cx="50" cy="30" r="10" />
          <line x1="50" y1="12" x2="50" y2="6" />
          <line x1="68" y1="20" x2="73" y2="15" />
          <line x1="32" y1="20" x2="27" y2="15" />
          {/* Tilted Solar Grid */}
          <path d="M 22 60 L 32 86 L 68 86 L 78 60 Z" />
          <line x1="50" y1="60" x2="50" y2="86" />
          <line x1="26" y1="73" x2="74" y2="73" />
        </svg>
      </div>

      {/* Doodle 7 [NEW]: Welding Helmet & Electric Arc Sparks (Welding & Metalwork) - Top Far-Left */}
      <div className="absolute top-[6%] left-[3%] opacity-20 dark:opacity-15 text-[#BD5324] transform -rotate-6">
        <svg width="65" height="65" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Welder mask helmet contour */}
          <path d="M 30 20 C 30 14 70 14 70 20 L 76 52 C 76 68 66 84 50 86 C 34 84 24 68 24 52 Z" />
          {/* Protective glass viewport window */}
          <rect x="36" y="34" width="28" height="14" rx="2" strokeWidth="2" />
          <line x1="42" y1="38" x2="48" y2="44" strokeWidth="1.5" />
          <line x1="50" y1="38" x2="56" y2="44" strokeWidth="1.5" />
          {/* Electric arc spark flares */}
          <path d="M 78 28 L 86 24 M 82 34 L 92 36 M 80 42 L 88 46" strokeDasharray="1 1" />
        </svg>
      </div>

      {/* Doodle 8 [NEW]: Painter's Roller with Wet Drips (Painting & Finishes) - Top Far-Right */}
      <div className="absolute top-[5%] right-[4%] opacity-20 dark:opacity-15 text-[#BD5324] transform rotate-12">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Paint roller cylinder */}
          <rect x="34" y="16" width="38" height="18" rx="4" />
          {/* Frame arm */}
          <path d="M 72 25 L 80 25 L 80 48 L 54 48 L 54 68" />
          {/* Grip handle */}
          <rect x="48" y="68" width="12" height="22" rx="3" />
          {/* Drips and droplets */}
          <path d="M 40 34 Q 40 40 42 41 Q 44 40 44 34" fill="currentColor" fillOpacity="0.3" />
          <circle cx="42" cy="46" r="2" fill="currentColor" />
          <circle cx="58" cy="40" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* Doodle 9 [NEW]: Claw Hammer & Framer's Nails (Construction Framing) - Mid Far-Left */}
      <div className="absolute top-[42%] left-[2%] opacity-18 dark:opacity-12 text-[#BD5324] transform rotate-25">
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Hammer head */}
          <path d="M 28 32 L 62 32 C 68 32 74 34 76 38 L 74 44 C 68 40 60 40 56 42 L 28 42 Z" />
          {/* Curved claw */}
          <path d="M 64 32 C 72 26 80 18 84 10 C 80 22 74 28 66 32" />
          {/* Wooden handle */}
          <path d="M 38 42 L 48 88 C 49 92 44 94 40 93 L 34 91 C 30 90 31 85 32 82 L 32 42 Z" />
          {/* Nails */}
          <line x1="72" y1="58" x2="84" y2="70" strokeWidth="2" />
          <line x1="68" y1="62" x2="72" y2="58" strokeWidth="3" />
          <line x1="78" y1="74" x2="88" y2="84" strokeWidth="2" />
          <line x1="74" y1="78" x2="78" y2="74" strokeWidth="3" />
        </svg>
      </div>

      {/* Doodle 10 [NEW]: Retractable Steel Tape Measure (Site Survey & Accuracy) - Mid Far-Right */}
      <div className="absolute top-[44%] right-[2%] opacity-18 dark:opacity-12 text-[#BD5324] transform -rotate-15">
        <svg width="66" height="66" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Tape measure housing body */}
          <rect x="22" y="32" width="46" height="46" rx="10" />
          <circle cx="45" cy="55" r="14" strokeDasharray="3 2" />
          {/* Belt clip */}
          <path d="M 36 48 L 45 48 L 45 62 L 36 62" />
          {/* Extended steel tape blade */}
          <path d="M 68 64 L 92 64 L 92 72 L 68 72 Z" />
          {/* Ruler measurement tick marks */}
          <line x1="74" y1="64" x2="74" y2="68" />
          <line x1="80" y1="64" x2="80" y2="70" />
          <line x1="86" y1="64" x2="86" y2="68" />
          {/* Hook clip */}
          <line x1="92" y1="64" x2="92" y2="76" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Doodle 11 [NEW]: Spirit Bubble Level (Precision Leveling) - Bottom Far-Left */}
      <div className="absolute bottom-[10%] left-[3%] opacity-20 dark:opacity-15 text-[#BD5324] transform rotate-12">
        <svg width="74" height="40" viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Level body beam */}
          <rect x="10" y="16" width="100" height="28" rx="5" />
          {/* Center horizontal bubble vial */}
          <rect x="42" y="24" width="36" height="12" rx="6" />
          <line x1="53" y1="24" x2="53" y2="36" strokeWidth="1.5" />
          <line x1="67" y1="24" x2="67" y2="36" strokeWidth="1.5" />
          {/* Air bubble indicator */}
          <circle cx="60" cy="30" r="3" fill="currentColor" fillOpacity="0.4" />
          {/* Plumb end vials */}
          <rect x="20" y="22" width="10" height="16" rx="3" />
          <rect x="90" y="22" width="10" height="16" rx="3" />
        </svg>
      </div>

      {/* Doodle 12 [NEW]: Safety Hard Hat / Helmet (Site Safety & Inspection) - Bottom Far-Right */}
      <div className="absolute bottom-[8%] right-[4%] opacity-20 dark:opacity-15 text-[#BD5324] transform -rotate-10">
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Helmet dome */}
          <path d="M 22 56 C 22 34 32 20 50 20 C 68 20 78 34 78 56 Z" />
          {/* Front visor brim */}
          <path d="M 14 56 C 14 56 34 52 50 52 C 66 52 86 56 86 56 C 88 56 90 58 88 62 C 86 66 76 68 50 68 C 24 68 14 66 12 62 C 10 58 12 56 14 56 Z" />
          {/* Center ridge ridge cap */}
          <path d="M 48 20 L 48 52 M 52 20 L 52 52" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Doodle 13 [NEW]: Lineman's Pliers / Wire Cutters (Cabling & Electrical) - Upper Center-Left */}
      <div className="absolute top-[28%] left-[28%] opacity-15 dark:opacity-10 text-[#BD5324] transform -rotate-25">
        <svg width="56" height="56" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Jaws */}
          <path d="M 44 26 L 40 40 L 48 44 L 54 36 Z" />
          <path d="M 56 26 L 60 40 L 52 44 L 46 36 Z" />
          {/* Pivot rivet */}
          <circle cx="50" cy="44" r="5" />
          <circle cx="50" cy="44" r="2" fill="currentColor" />
          {/* Insulated handle 1 */}
          <path d="M 46 48 L 32 82 C 30 87 35 90 38 86 L 49 52" />
          {/* Insulated handle 2 */}
          <path d="M 54 48 L 68 82 C 70 87 65 90 62 86 L 51 52" />
        </svg>
      </div>

      {/* Doodle 14 [NEW]: Precision Vernier Caliper (Machining & Engineering) - Upper Center-Right */}
      <div className="absolute top-[26%] right-[28%] opacity-15 dark:opacity-10 text-[#BD5324] transform rotate-20">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Main ruler beam */}
          <rect x="20" y="38" width="68" height="12" rx="1" />
          <line x1="30" y1="38" x2="30" y2="44" />
          <line x1="40" y1="38" x2="40" y2="46" />
          <line x1="50" y1="38" x2="50" y2="44" />
          <line x1="60" y1="38" x2="60" y2="46" />
          <line x1="70" y1="38" x2="70" y2="44" />
          {/* Fixed external jaw */}
          <path d="M 20 38 L 20 74 C 20 78 24 78 26 72 L 30 50" />
          {/* Sliding vernier jaw */}
          <path d="M 44 32 L 44 70 C 44 74 48 74 50 68 L 54 50" />
          {/* Internal measuring nibs */}
          <path d="M 20 38 L 20 22 C 20 18 24 18 26 22 L 30 38" />
          <path d="M 44 38 L 44 22 C 44 18 48 18 50 22 L 54 38" />
        </svg>
      </div>

      {/* Doodle 15 [NEW]: Industrial Interlocking Gear (Generators & Equipment) - Bottom Center-Left */}
      <div className="absolute bottom-[18%] left-[26%] opacity-15 dark:opacity-10 text-[#BD5324] transform rotate-45">
        <svg width="58" height="58" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="50" r="18" />
          <circle cx="50" cy="50" r="7" fill="currentColor" fillOpacity="0.2" />
          {/* Cog teeth */}
          <path d="M 46 22 L 54 22 L 53 28 L 47 28 Z" />
          <path d="M 46 72 L 54 72 L 53 78 L 47 78 Z" />
          <path d="M 22 46 L 22 54 L 28 53 L 28 47 Z" />
          <path d="M 72 46 L 72 54 L 78 53 L 78 47 Z" />
          <path d="M 30 30 L 36 24 L 40 28 L 34 34 Z" />
          <path d="M 64 64 L 70 70 L 66 74 L 60 68 Z" />
          <path d="M 64 36 L 70 30 L 74 34 L 68 40 Z" />
          <path d="M 30 64 L 24 70 L 28 74 L 34 68 Z" />
        </svg>
      </div>

      {/* Doodle 16 [NEW]: Subtle Architectural Drafting Marks & Crosshairs (Blueprint Aesthetic) */}
      <div className="absolute top-[52%] left-[48%] opacity-15 dark:opacity-10 text-[#BD5324] transform -rotate-3">
        <svg width="50" height="50" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {/* Target crosshair with guide arcs */}
          <circle cx="50" cy="50" r="28" strokeDasharray="3 4" />
          <line x1="50" y1="12" x2="50" y2="88" strokeDasharray="2 3" />
          <line x1="12" y1="50" x2="88" y2="50" strokeDasharray="2 3" />
          <circle cx="50" cy="50" r="4" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </div>

    </div>
  );
};
