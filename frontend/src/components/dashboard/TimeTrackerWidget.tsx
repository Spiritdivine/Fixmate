import React, { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
import { clsx } from 'clsx';

export const TimeTrackerWidget: React.FC = () => {
  const [seconds, setSeconds] = useState(73815); // 20:30:15 approx
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Time Tracker</h3>
        <p className="text-sm font-medium text-slate-500 leading-relaxed pr-2">
          Your task are still not done. Ensure that you have more completed tasks!
        </p>
      </div>

      <div className="mt-4 bg-[#0d3b26] rounded-3xl p-5 flex items-center justify-between">
        <div>
          <div className="text-white text-[13px] font-semibold mb-1">Time Tracker</div>
          <div className="text-white text-2xl font-bold font-mono tracking-wider">
            {formatTime(seconds)}
          </div>
        </div>
        
        <button 
          onClick={() => { setIsActive(false); setSeconds(0); }}
          className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-[#186644] px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
};
