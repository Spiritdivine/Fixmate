import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAiChatStore } from '../../stores/aiChatStore';

export const FloatingOgaJohnTrigger: React.FC = () => {
  const { isOpen, toggleChat } = useAiChatStore();
  const [isHovered, setIsHovered] = useState(false);

  // If the chat modal is already full-screen or open, keep the trigger clean
  if (isOpen) return null;

  return (
    <aside
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 select-none"
      aria-label="AI Assistant Floating Trigger"
    >
      {/* Sleek Tooltip Badge on Hover */}
      <div
        className={`hidden sm:flex items-center px-3 py-1.5 rounded-full bg-stone-900/90 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-stone-800 transition-all duration-200 pointer-events-none ${
          isHovered
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-2'
        }`}
      >
        <span>Talk to Oga John</span>
      </div>

      {/* Circular Floating Trigger Button */}
      <button
        type="button"
        onClick={toggleChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#123E2A] hover:bg-[#0E3222] border-2 border-emerald-500/40 hover:border-emerald-400 text-white flex items-center justify-center shadow-xl hover:shadow-2xl shadow-emerald-950/40 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        title="Talk to Oga John"
        aria-label="Talk to Oga John"
      >
        {/* Ambient Pulse Ring */}
        <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-400/30 animate-pulse pointer-events-none" />

        {/* Website Brand Icon Emblem */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 flex items-center justify-center p-1 relative z-10 transition-transform duration-200 group-hover:scale-110">
          <img
            src="/brand/artifix-icon-transparent.png"
            alt="Talk to Oga John"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Small Active Speech Bubble Indicator Badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-[#123E2A] z-20 shadow-xs">
          <MessageSquare className="w-2.5 h-2.5 fill-white" />
        </span>
      </button>
    </aside>
  );
};
