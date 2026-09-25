import React, { useState } from 'react';
import {
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { SeoHead } from '../../components/seo/SeoHead';
import { trackEvent } from '../../lib/posthog';
import { FrequentlyAskedQuestions } from '../../components/common/FrequentlyAskedQuestions';

interface FormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'CLIENT' | 'ARTISAN' | 'BUSINESS' | 'DISPUTE' | 'OTHER';
  subject: string;
  message: string;
  contractReference: string;
  hp_field: string;
}

const INITIAL_FORM: FormState = {
  fullName: '',
  email: '',
  phoneNumber: '',
  role: 'CLIENT',
  subject: '',
  message: '',
  contractReference: '',
  hp_field: '',
};

export const ContactUsPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/contact', form);
      const ticket = response.data?.ticketId || 'AFX-' + Math.floor(100000 + Math.random() * 900000);
      setSuccessTicketId(ticket);
      setForm(INITIAL_FORM);
      trackEvent('contact_ticket_submitted', { role: form.role, subject: form.subject });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to submit your message right now. Please try again or reach out on WhatsApp.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-20">
      <SeoHead
        title="Contact Us & Operational Hubs | Artifix"
        description="Direct communication channels for homeowners, verified artisans, and commercial partners. Contact our team in Lekki, Lagos and Wuse II, Abuja."
        canonical="https://artifixhq.xyz/contact"
        ogType="website"
        ogImage="/api/v1/og/contact"
        ogImageAlt="Contact Artifix"
        twitterCard="summary_large_image"
      />

      {/* ============================================================ */}
      {/* 1. HERO HEADER                                               */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-3">
              DIRECT INQUIRIES &amp; OPERATIONS
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#141A16] leading-[1.1] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Get in touch with the{' '}
              <span
                className="font-serif italic font-normal text-[#121814]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Artifix team.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              Direct assistance for homeowners, active project escrow contracts, trade verification assessments, and corporate facility deployments across Nigeria.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CHANNELS + TICKET FORM                                    */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Direct Contact Details & Physical Hubs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Channel Cards */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <h2
                className="text-lg font-bold text-[#141A16] mb-4"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Direct Support Channels
              </h2>

              <div className="space-y-4 text-xs sm:text-[13px]">
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-200/60"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <div className="font-bold text-[#141A16]">WhatsApp Support Line</div>
                    <div className="text-stone-500 font-normal">Instant messaging for active job inquiries</div>
                    <div className="text-emerald-700 font-semibold mt-0.5">+234 (0) 800 ARTIFIX</div>
                  </div>
                </a>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl border border-transparent">
                  <div className="w-9 h-9 rounded-xl bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#141A16]">Email Inquiries</div>
                    <div className="text-stone-500 font-normal">Support: support@artifixhq.xyz</div>
                    <div className="text-stone-500 font-normal">Disputes: disputes@artifixhq.xyz</div>
                    <div className="text-stone-500 font-normal">Partnerships: enterprise@artifixhq.xyz</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl border border-transparent">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#141A16]">Operating Hours</div>
                    <div className="text-stone-500 font-normal">Monday – Friday: 8:00 AM – 7:00 PM WAT</div>
                    <div className="text-stone-500 font-normal">Saturday: 9:00 AM – 5:00 PM WAT</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Hubs */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <h2
                className="text-lg font-bold text-[#141A16] mb-4"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Physical Operational Hubs
              </h2>

              <div className="space-y-4 text-xs sm:text-[13px]">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
                  <div className="flex items-center gap-2 font-bold text-[#141A16] mb-1">
                    <MapPin className="w-4 h-4 text-[#123E2A]" />
                    <span>Lekki Assessment Hub (Lagos)</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed font-normal">
                    Plot 14, Admiralty Way, Lekki Phase 1, Lagos State.<br />
                    <span className="text-[11px] text-stone-500">In-person trade testing, tool reviews &amp; dispute hearings.</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
                  <div className="flex items-center gap-2 font-bold text-[#141A16] mb-1">
                    <MapPin className="w-4 h-4 text-[#123E2A]" />
                    <span>Abuja Liaison Office (FCT)</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed font-normal">
                    Aminu Kano Crescent, Wuse II, Abuja.<br />
                    <span className="text-[11px] text-stone-500">Commercial facilities and institutional partnerships.</span>
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Priority Ticket Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-stone-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h2
                className="text-xl sm:text-2xl font-bold text-[#141A16] mb-1.5"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Send a Message
              </h2>
              <p className="text-xs sm:text-[13px] text-stone-500 mb-6 font-normal">
                Fill in your details below and a team member will review your inquiry.
              </p>

              {successTicketId ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950">
                  <div className="flex items-center gap-2.5 mb-2 font-bold text-base text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>Ticket Submitted Successfully</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800 mb-4 leading-relaxed font-normal">
                    Your reference number is <strong className="font-mono font-bold text-emerald-950">{successTicketId}</strong>. We have logged your request and our support desk will respond via email or WhatsApp within operating hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuccessTicketId(null)}
                    className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Honeypot field (hidden from real users) */}
                  <input
                    type="text"
                    name="hp_field"
                    value={form.hp_field}
                    onChange={(e) => setForm({ ...form, hp_field: e.target.value })}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Row 1: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="e.g. Babatunde Adeyemi"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#123E2A] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@domain.com"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#123E2A] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Phone Number (WhatsApp Preferred) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phoneNumber}
                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                        placeholder="0803 123 4567"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#123E2A] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        I Am A... *
                      </label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#123E2A] focus:outline-none transition-colors bg-white"
                      >
                        <option value="CLIENT">Homeowner / Client</option>
                        <option value="ARTISAN">Artisan / Tradesman</option>
                        <option value="BUSINESS">Corporate / Developer</option>
                        <option value="DISPUTE">Escrow Contract Dispute</option>
                        <option value="OTHER">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Subject & Optional Contract Ref */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Inquiry Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="e.g. Question on Solar Milestone Settlement"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#123E2A] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Contract ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.contractReference}
                        onChange={(e) => setForm({ ...form, contractReference: e.target.value })}
                        placeholder="e.g. ESC-9021 (if applicable)"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#123E2A] focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 4: Message */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Detailed Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Please describe your question, project requirement, or issue in detail..."
                      className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-stone-200 focus:border-[#123E2A] focus:outline-none transition-colors leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#123E2A] hover:bg-[#0E3222] text-white text-xs sm:text-[13px] font-semibold px-7 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CANONICAL PLATFORM FAQ                                     */}
      {/* ============================================================ */}
      <FrequentlyAskedQuestions showContactCta={false} className="mt-16 sm:mt-20 border-t-0" />
    </div>
  );
};

export default ContactUsPage;
