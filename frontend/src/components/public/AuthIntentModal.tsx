import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Star, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { ArtisanProfile } from '../../types';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../stores/authStore';

interface AuthIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  artisan: ArtisanProfile | null;
}

export const AuthIntentModal: React.FC<AuthIntentModalProps> = ({
  isOpen,
  onClose,
  artisan,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!isOpen || !artisan) return null;

  const handleClientAction = () => {
    onClose();
    if (user) {
      if (user.role === 'CLIENT') {
        navigate(`/client/artisans/${artisan.id}?action=invite`);
      } else {
        navigate('/client/dashboard');
      }
    } else {
      navigate(`/register?role=CLIENT&artisanId=${artisan.id}&action=hire`);
    }
  };

  const handleLoginRedirect = () => {
    onClose();
    navigate(`/login?redirect=/p/${artisan.id}`);
  };

  const ratingNum = typeof artisan.ratingAvg === 'number' 
    ? artisan.ratingAvg 
    : parseFloat(String(artisan.ratingAvg || '5.0'));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#141A16]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#FAF7F0] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="bg-[#123E2A] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Verified Escrow Hiring
              </h3>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                Zero advance risk • 100% milestone protected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7">
          
          {/* Selected Artisan Badge Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200/80 flex items-center gap-4 mb-6">
            <Avatar
              src={artisan.user?.avatarUrl || undefined}
              name={artisan.businessName || artisan.user?.email || 'Artisan'}
              size="lg"
              className="w-14 h-14 rounded-2xl ring-2 ring-[#123E2A]/10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <h4 className="text-sm sm:text-base font-bold text-[#141A16] truncate">
                  {artisan.businessName || 'Verified Artisan'}
                </h4>
                {artisan.user?.isKycVerified && (
                  <span className="inline-flex items-center gap-1 bg-[#108A00]/10 text-[#108A00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 truncate mb-1">
                {artisan.tagline || `${artisan.lgaCity}, ${artisan.state}`}
              </p>
              <div className="flex items-center gap-3 text-xs text-stone-600 font-medium">
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {ratingNum.toFixed(1)}
                  <span className="text-stone-400 font-normal">({artisan.reviewCount || 0})</span>
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-500 font-medium">
                  {artisan.completedJobsCount || 0} jobs done
                </span>
              </div>
            </div>
          </div>

          {/* Value Highlights */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-[13px] text-stone-700 leading-snug">
                <strong className="text-[#141A16] font-semibold">Funds held in escrow:</strong> You never pay upfront to the artisan. Funds are only released when you inspect and approve milestones.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-[13px] text-stone-700 leading-snug">
                <strong className="text-[#141A16] font-semibold">Direct quote &amp; scope:</strong> Post your job or request an exact quote directly from this artisan with zero platform commission for clients.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-[13px] text-stone-700 leading-snug">
                <strong className="text-[#141A16] font-semibold">Dispute resolution guaranteed:</strong> Monad blockchain smart contracts back our 24h arbitration tribunal.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleClientAction}
              className="w-full bg-[#123E2A] text-white hover:bg-[#0E3222] font-semibold text-sm py-3.5 px-6 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{user?.role === 'CLIENT' ? 'Invite Artisan to Job' : 'Sign Up as Client to Hire'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!user && (
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="w-full text-stone-600 hover:text-[#141A16] font-medium text-xs py-2 transition-colors text-center"
              >
                Already have an account? <span className="font-bold underline text-[#123E2A]">Log In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
