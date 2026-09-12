import React from 'react';
import { Contract } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ActiveContractsWidgetProps {
  contracts: Contract[];
}

export const ActiveContractsWidget: React.FC<ActiveContractsWidgetProps> = ({ contracts }) => {
  const total = contracts.length || 1;
  const activeCount = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'PENDING_FUNDING').length;
  const activePercentage = Math.round((activeCount / total) * 100);

  const data = [
    { name: 'Active', value: activePercentage },
    { name: 'Other', value: 100 - activePercentage },
  ];

  const COLORS = ['#186644', '#f1f5f9']; // Dark green and light slate

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col items-center">
      <div className="w-full flex justify-start mb-2">
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
          <div className="text-3xl font-bold text-slate-800">{activePercentage}%</div>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <h4 className="text-lg font-bold text-slate-800 mb-2">{activeCount} Active Contracts</h4>
        <p className="text-sm font-medium text-slate-500 leading-relaxed px-2">
          You have {activeCount} active contracts that still need your attention.
        </p>
      </div>
    </div>
  );
};
