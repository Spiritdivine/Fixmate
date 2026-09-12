import React from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsData {
  day: string;
  value: number;
  fillType?: 'dark' | 'light' | 'striped';
  tooltip?: string;
}

interface EarningsAnalyticsChartProps {
  data: AnalyticsData[];
  title?: string;
}

export const EarningsAnalyticsChart: React.FC<EarningsAnalyticsChartProps> = ({ 
  data,
  title = "Project Analytics"
}) => {
  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col relative">
      <h3 className="text-base font-semibold text-slate-800 mb-6">{title}</h3>
      
      <div className="flex-1 w-full min-h-[160px] relative mt-2">
        {/* Absolute top badge if desired */}
        {false && (
          <div className="absolute top-2 left-1/2 -translate-x-[4%] bg-white shadow-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-600 z-10 hidden sm:block">
            74%
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barSize={32}>
            <defs>
              <pattern id="striped-pattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                {/* Thick light gray lines for stripes */}
                <line x1="0" y="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="4" />
                <line x1="4" y="0" x2="4" y2="8" stroke="#e2e8f0" strokeWidth="4" />
              </pattern>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 500 }} 
              dy={15}
            />
            <Bar dataKey="value" radius={[20, 20, 20, 20]}>
              {data.map((entry, index) => {
                let fill = 'url(#striped-pattern)';
                if (entry.fillType === 'dark') fill = '#186644';
                if (entry.fillType === 'light') fill = '#4ade80';
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
