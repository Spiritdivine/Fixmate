import React from 'react';
import { Video } from 'lucide-react';
import { JobInvitation } from '../../types';

interface RemindersWidgetProps {
  invitations: JobInvitation[];
}

export const RemindersWidget: React.FC<RemindersWidgetProps> = ({ invitations }) => {
  const latestInvite = invitations[0];

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Reminders</h3>
        
        {latestInvite ? (
          <div>
            <h4 className="text-xl font-bold text-[#186644] leading-tight mb-2 pr-4">
              Review Proposal:<br/>
              {latestInvite.job?.title || 'Client Project'}
            </h4>
            <p className="text-[13px] font-medium text-slate-500">
              Time : 02.00 pm - 04.00 pm
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-xl font-bold text-[#186644] leading-tight mb-2 pr-4">
              Meeting with Arc<br/>Company
            </h4>
            <p className="text-[13px] font-medium text-slate-500">
              Time : 02.00 pm - 04.00 pm
            </p>
          </div>
        )}
      </div>

      <button className="w-full mt-6 flex items-center justify-center gap-2 bg-[#186644] hover:bg-[#124d33] text-white py-3 rounded-full text-sm font-medium transition-colors shadow-sm">
        <Video className="w-4 h-4" />
        <span>Start Meeting</span>
      </button>
    </div>
  );
};
