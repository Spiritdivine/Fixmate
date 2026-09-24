import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ShieldCheck, X, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import { Job } from '../../types';
import { formatNgn } from '../../lib/formatters';
import { useAuthStore } from '../../stores/authStore';

interface ArtisanBidIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export const ArtisanBidIntentModal: React.FC<ArtisanBidIntentModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!isOpen || !job) return null;

  const handleAction = () => {
    onClose();
    if (user) {
      if (user.role === 'ARTISAN') {
        navigate(`/artisan/jobs/${job.id}/propose`);
      } else {
        navigate('/artisan/dashboard');
      }
    } else {
      navigate(`/register?role=ARTISAN&redirect=/artisan/jobs/${job.id}/propose`);
    }
  };

  const handleLogin = () => {
    onClose();
    navigate(`/login?redirect=/artisan/jobs/${job.id}/propose`);
  };

  const budgetText =
    job.budgetMin && job.budgetMax
      ? `₦${Number(job.budgetMin).toLocaleString()} – ₦${Number(job.budgetMax).toLocaleString()}`
      : 'Competitive Budget';

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

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#FAF7F0] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-[#123E2A] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Submit Proposal as Artisan
              </h3>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                0% bidding fees • Guaranteed escrow payouts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7">
          
          {/* Target Job Card Summary */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-sm mb-6">
            <span className="inline-block bg-[#123E2A]/10 text-[#123E2A] text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 uppercase tracking-wide">
              {job.category?.name || 'Skilled Contract'}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-[#141A16] mb-1.5 leading-snug">
              {job.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-stone-600 font-medium">
              <span className="text-[#123E2A] font-extrabold text-sm">
                {budgetText}
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1 text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-[#123E2A]" />
                {job.lgaCity ? `${job.lgaCity}, ${job.state}` : job.state}
              </span>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-[13px] text-stone-700 leading-snug">
                <strong className="text-[#141A16] font-semibold">100% Escrow Funded:</strong> Client deposits project funds before you start work. No stories or unpaid balances.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-[13px] text-stone-700 leading-snug">
                <strong className="text-[#141A16] font-semibold">Zero Bidding Fees:</strong> You keep 100% of your earnings. We do not sell tokens or charge application fees.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-[13px] text-stone-700 leading-snug">
                <strong className="text-[#141A16] font-semibold">Build On-Chain Reputation:</strong> Every completed job boosts your rating and unlocks higher-budget corporate contracts.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleAction}
              className="w-full bg-[#123E2A] hover:bg-[#0E3222] text-white font-semibold text-sm py-3.5 px-6 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{user?.role === 'ARTISAN' ? 'Submit Proposal Now' : 'Register as Artisan & Bid'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!user && (
              <button
                type="button"
                onClick={handleLogin}
                className="w-full text-stone-600 hover:text-[#141A16] font-medium text-xs py-2 transition-colors text-center"
              >
                Already have an artisan account? <span className="font-bold underline text-[#123E2A]">Log In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
