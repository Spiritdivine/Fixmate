import React from 'react';
import { ArtisanProfile } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopArtisansWidgetProps {
  artisans: ArtisanProfile[];
}

export const TopArtisansWidget: React.FC<TopArtisansWidgetProps> = ({ artisans }) => {
  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-800">Recommended Pros</h3>
        <Link 
          to="/client/artisans"
          className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-colors"
        >
          See More
        </Link>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-2" style={{ maxHeight: '480px' }}>
        {artisans.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">No recommendations available.</div>
        ) : (
          artisans.slice(0, 7).map((artisan) => {
            const name = artisan.businessName || `${artisan.user?.email || 'Artisan'}`;
            return (
              <div key={artisan.id} className="flex items-center justify-between gap-3 p-2 rounded-[24px] hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative">
                    <Avatar 
                      src={artisan.user?.avatarUrl} 
                      name={name} 
                      size="md" 
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-bold text-slate-800 truncate">{name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-[12px] font-medium text-slate-600">
                        {Number(artisan.ratingAvg || 5.0).toFixed(1)}
                      </span>
                      <span className="text-[12px] text-slate-400">
                        ({artisan.reviewCount || 0})
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/client/artisans/${artisan.id}`}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#186644] text-white hover:bg-[#124d33] transition-colors shrink-0 shadow-sm"
                >
                  View
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
