import React from 'react';
import { Contract } from '../../types';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PendingSubmission {
  contract: Contract;
  milestoneTitle: string;
  milestoneId: string;
}

interface PendingSubmissionsWidgetProps {
  submissions: PendingSubmission[];
}

export const PendingSubmissionsWidget: React.FC<PendingSubmissionsWidgetProps> = ({ submissions }) => {
  const latestSubmission = submissions[0];

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Reminders</h3>
        
        {latestSubmission ? (
          <div>
            <h4 className="text-xl font-bold text-[#186644] leading-tight mb-2 pr-4">
              Work Submitted:<br/>
              {latestSubmission.milestoneTitle}
            </h4>
            <p className="text-[13px] font-medium text-slate-500">
              Needs your review
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-xl font-bold text-[#186644] leading-tight mb-2 pr-4">
              All Caught<br/>Up
            </h4>
            <p className="text-[13px] font-medium text-slate-500">
              No pending reviews
            </p>
          </div>
        )}
      </div>

      {latestSubmission ? (
        <Link 
          to={`/client/contracts/${latestSubmission.contract.id}`}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-[#186644] hover:bg-[#124d33] text-white py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
        >
          <span>Inspect Work</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-100 text-slate-400 py-3 rounded-full text-sm font-medium shadow-sm">
          <span>Inspect Work</span>
        </div>
      )}
    </div>
  );
};
