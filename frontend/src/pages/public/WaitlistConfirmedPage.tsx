import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Check,
  Copy,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { SeoHead } from '../../components/seo/SeoHead';
import { trackEvent } from '../../lib/posthog';

export const WaitlistConfirmedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const nameParam = searchParams.get('name') || '';
  const roleParam = searchParams.get('role') || '';
  const refCode = searchParams.get('ref') || 'AFX-' + Math.floor(100000 + Math.random() * 900000);

  useEffect(() => {
    trackEvent('waitlist_confirmed_viewed', { refCode, role: roleParam });
  }, [refCode, roleParam]);

  const shareUrl = window.location.origin;
  const whatsappText = `I registered with Artifix — verified Nigerian tradesmen and smart contract escrow protection for home projects. Check out the platform: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent('waitlist_share_link_copied', { refCode });
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full pb-20">
      <SeoHead
        title="Application Confirmed | Artifix Founding Member"
        description="Your founding member application on Artifix has been recorded. Review rollout stages and next steps."
        canonical="https://artifix.app/waitlist/confirmed"
        ogType="website"
        ogImage="/api/v1/og/default"
        ogImageAlt="Artifix Waitlist Confirmed"
        twitterCard="summary_large_image"
      />

      {/* ============================================================ */}
      {/* 1. HERO HEADER                                               */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-3">
              FOUNDING APPLICATION RECORDED
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#141A16] leading-[1.1] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              {nameParam ? `Welcome, ${nameParam}. ` : 'Application received. '}
              You are on the{' '}
              <span
                className="font-serif italic font-normal text-[#121814]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                founding list.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              Thank you for registering. We are onboarding members in structured regional batches starting with Lagos and Abuja to ensure quality verification standards.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CONFIRMATION STATUS CARD                                  */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-stone-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Application Reference
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#123E2A] mt-0.5">
                  {refCode}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Verification Status
                </div>
                <div className="text-xs font-mono font-semibold text-stone-800 mt-1">
                  Queued for Batch Review (Lagos &amp; Abuja)
                </div>
              </div>
            </div>

            {/* Regional Rollout Notice */}
            <div className="my-6 p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/70 flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-[#123E2A] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-normal">
                <strong>Regional Verification Rollout:</strong> In-person trade assessments and initial escrow deployments are activating in Lagos State (Lekki, Victoria Island, Ikeja) and Abuja (Wuse II, Maitama).
              </div>
            </div>

            {/* Next Steps List */}
            <h2
              className="text-base font-bold text-[#141A16] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Onboarding Process
            </h2>

            <div className="space-y-4 text-xs sm:text-[13px]">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200/80 text-stone-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="font-bold text-[#141A16]">Identity &amp; Trade Credential Review</div>
                  <div className="text-stone-500 font-normal leading-relaxed">
                    Our compliance desk cross-references your submitted details against our accreditation registry.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200/80 text-stone-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="font-bold text-[#141A16]">Direct Invitation Link</div>
                  <div className="text-stone-500 font-normal leading-relaxed">
                    Once your local cluster activates, you will receive an invitation link to finalize your verified profile.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200/80 text-stone-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="font-bold text-[#141A16]">First Contract &amp; Escrow Milestone</div>
                  <div className="text-stone-500 font-normal leading-relaxed">
                    Post your first project or complete physical trade inspection to begin executing milestone-protected work.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Share & Explore */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Share Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <h2
                className="text-base font-bold text-[#141A16] mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Share with Peers
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed mb-4 font-normal">
                Invite homeowners, facility managers, or master tradesmen in your network.
              </p>

              <div className="space-y-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Share on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span className="text-emerald-800">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>Copy Website Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* In the Meantime Links */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <h2
                className="text-sm font-bold text-[#141A16] mb-3"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Explore While You Wait
              </h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/trades"
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 text-stone-700 font-medium transition-colors"
                  >
                    <span>Nigerian Trade Benchmarks</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 text-stone-700 font-medium transition-colors"
                  >
                    <span>Fee Transparency &amp; Calculator</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/security"
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 text-stone-700 font-medium transition-colors"
                  >
                    <span>Smart Contract Escrow Security</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </Link>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
};

export default WaitlistConfirmedPage;
