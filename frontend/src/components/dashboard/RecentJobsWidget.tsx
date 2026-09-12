import React from 'react';
import { Contract } from '../../types';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentJobsWidgetProps {
  contracts: Contract[];
}

export const RecentJobsWidget: React.FC<RecentJobsWidgetProps> = ({ contracts }) => {
  const displayContracts = contracts.slice(0, 4); // Show top 4

  const getIconColor = (index: number) => {
    const colors = [
      'bg-amber-100 text-amber-600',
      'bg-blue-100 text-emerald-700',
      'bg-emerald-100 text-emerald-600',
      'bg-purple-100 text-purple-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-800">Project</h3>
        <Link 
          to="/artisan/contracts" 
          className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex-1 space-y-5">
        {displayContracts.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">No recent projects found.</div>
        ) : (
          displayContracts.map((contract, index) => {
            const initial = (contract.job?.title || `Contract #${contract.contractCode}`).charAt(0).toUpperCase();
            return (
              <div key={contract.id} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-[24px] flex items-center justify-center font-bold text-lg shrink-0 ${getIconColor(index)}`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-slate-800 truncate">
                    {contract.job?.title || `Contract #${contract.contractCode}`}
                  </h4>
                  <div className="text-[13px] font-medium text-slate-500 mt-0.5">
                    Status : <span className="text-[#186644]">Discuss</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
