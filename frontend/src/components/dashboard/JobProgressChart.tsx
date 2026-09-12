import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface JobProgressChartProps {
  completedPercentage: number;
}

export const JobProgressChart: React.FC<JobProgressChartProps> = ({ completedPercentage }) => {
  const data = [
    { name: 'Completed', value: completedPercentage },
    { name: 'Remaining', value: 100 - completedPercentage },
  ];

  const COLORS = ['#186644', '#f1f5f9']; // Dark green and light slate

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">Project Progress</h3>
      </div>
      
      <div className="w-[140px] h-[140px] relative flex flex-col items-center justify-center my-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-bold text-slate-800">{completedPercentage}%</div>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <h4 className="text-lg font-bold text-slate-800 mb-2">3 Remaining Projects</h4>
        <p className="text-sm font-medium text-slate-500 leading-relaxed px-2">
          You have 3 remaining projects that still need your attention.
        </p>
      </div>
    </div>
  );
};
