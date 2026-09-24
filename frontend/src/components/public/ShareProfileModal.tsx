import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  QrCode,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { ArtisanProfile } from '../../types';
import { Avatar } from '../ui/Avatar';
import { trackEvent } from '../../lib/posthog';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  artisan: ArtisanProfile;
  shareUrl: string;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  isOpen,
  onClose,
  artisan,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const tradeName =
    artisan.skills?.[0]?.skill?.category?.name ||
    artisan.skills?.[0]?.skill?.name ||
    'Artisan';
  const locationName = `${artisan.lgaCity || ''}, ${artisan.state || 'Nigeria'}`.replace(/^,\s*/, '');
  const artisanName = artisan.businessName || artisan.user?.email?.split('@')[0] || 'Artisan';

  // WhatsApp Share Message
  const whatsappMessage = `Looking for a verified ${tradeName}${locationName ? ` in ${locationName}` : ''}? Check out ${artisanName}'s verified portfolio, reviews, and escrow pricing on Artifix:\n\n${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  // Twitter / X Share
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out ${artisanName}'s verified ${tradeName} portfolio on @ArtifixEscrow:`
  )}&url=${encodeURIComponent(shareUrl)}`;

  // LinkedIn Share
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  // QR Code Image URL (using reliable fast standard QR service with SVG output)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}&bgcolor=FAF7F0&color=123E2A&margin=8`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackEvent('artisan_profile_link_copied', { artisan_id: artisan.id });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

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
      <div className="relative w-full max-w-md bg-[#FAF7F0] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#123E2A] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Share Artisan Profile
            </h3>
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
        <div className="p-6">
          
          {/* Artisan Summary Snippet */}
          <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-sm flex items-center gap-3.5 mb-5">
            <Avatar
              src={artisan.user?.avatarUrl || undefined}
              name={artisanName}
              size="md"
              className="w-12 h-12 rounded-xl ring-2 ring-[#123E2A]/10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-[#141A16] truncate">
                {artisanName}
              </h4>
              <p className="text-xs text-stone-500 truncate">
                {tradeName} {locationName && `• ${locationName}`}
              </p>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2.5 mb-5">
            {/* WhatsApp Share Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('artisan_shared_whatsapp', { artisan_id: artisan.id })}
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Share to WhatsApp (Chat / Status)</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
            </a>

            {/* Twitter & LinkedIn Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('artisan_shared_twitter', { artisan_id: artisan.id })}
                className="bg-black hover:bg-stone-800 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Share on X</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('artisan_shared_linkedin', { artisan_id: artisan.id })}
                className="bg-[#0A66C2] hover:bg-[#084e96] text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Share on LinkedIn</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>

          {/* Copy Link Input Bar */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
              Profile Link
            </label>
            <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-stone-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs text-stone-700 bg-transparent px-2 outline-none truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#123E2A] text-white hover:bg-[#0E3222]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Toggle / Display */}
          <div className="border-t border-stone-200/80 pt-4">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="w-full text-xs font-semibold text-[#123E2A] hover:text-[#0B3B24] flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQr ? 'Hide QR Code' : 'Show In-Person QR Code'}</span>
            </button>

            {showQr && (
              <div className="mt-4 p-4 bg-white rounded-2xl border border-stone-200 text-center animate-in fade-in duration-200">
                <img
                  src={qrCodeUrl}
                  alt={`QR code for ${artisanName}`}
                  className="w-44 h-44 mx-auto object-contain rounded-lg mb-2"
                />
                <p className="text-[11px] text-stone-500">
                  Scan with smartphone camera to view portfolio
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
