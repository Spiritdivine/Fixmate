import React from 'react';
import { Contract } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Phone } from 'lucide-react';
import { clsx } from 'clsx';

interface ClientInteractionsWidgetProps {
  contracts: Contract[];
}

export const ClientInteractionsWidget: React.FC<ClientInteractionsWidgetProps> = ({ contracts }) => {
  // Deduplicate clients for the interaction list
  const uniqueClients = contracts.reduce((acc, curr) => {
    if (curr.client && !acc.find(c => c.client?.id === curr.client?.id)) {
      acc.push(curr);
    }
    return acc;
  }, [] as Contract[]).slice(0, 4);

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Client Interactions</h2>
        <p className="text-sm text-slate-500 mb-6">Active communications & feedback</p>
        
        <div className="flex items-center justify-between">
          {/* Overlapping Avatars */}
          <div className="flex -space-x-4">
            {uniqueClients.length > 0 ? (
              uniqueClients.map((contract, i) => {
                const clientProfile = contract.client?.clientProfile;
                const name = clientProfile ? `${clientProfile.firstName} ${clientProfile.lastName}` : contract.client?.email || 'Client';
                return (
                  <div key={contract.id} className="relative z-10 rounded-full border-4 border-white" style={{ zIndex: 10 - i }}>
                    <Avatar 
                      src={contract.client?.avatarUrl} 
                      name={name} 
                      size="lg" 
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-400">No active team members</div>
            )}
            {uniqueClients.length > 0 && (
              <div className="relative z-0 flex items-center justify-center w-[48px] h-[48px] rounded-full border-4 border-white bg-slate-100 text-slate-500 font-bold text-sm">
                +3
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 bg-[#186644] hover:bg-[#124d33] text-white px-5 py-3 rounded-full text-sm font-medium transition-colors shadow-sm">
            <Phone className="w-4 h-4 fill-current" />
            <span>Call Team</span>
          </button>
        </div>
      </div>
    </div>
  );
};
