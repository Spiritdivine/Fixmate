import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  CheckCircle2,
  Bookmark,
  Send,
  MessageSquare,
  Briefcase,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronLeft,
  X,
  PlusCircle,
  ExternalLink,
  Award,
  Sparkles,
  Compass,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import {
  ArtisanProfile,
  Review,
  Job,
  ApiResponse,
} from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';

export const ArtisanPublicProfilePage: React.FC = () => {
  const { artisanId } = useParams<{ artisanId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'services' | 'reviews'>('overview');
  const [inviteModalOpen, setInviteModalOpen] = useState(searchParams.get('action') === 'invite');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // 1. Fetch Artisan Profile
  const { data: artisan, isLoading, error } = useQuery<ArtisanProfile>({
    queryKey: ['artisan-public-profile', artisanId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ArtisanProfile | { artisan: ArtisanProfile }>>(
        `/profiles/artisans/${artisanId}`
      );
      return (data.data as any)?.id ? (data.data as ArtisanProfile) : (data.data as any)?.artisan;
    },
    enabled: !!artisanId,
  });

  // 2. Fetch Artisan Reviews
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['artisan-public-reviews', artisan?.userId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Review[] | { reviews: Review[] }>>(
        `/reviews/artisan/${artisan?.userId}`
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.reviews) || [];
    },
    enabled: !!artisan?.userId,
  });

  // 3. Fetch Client's Open Jobs for Invitation Modal
  const { data: clientJobs = [] } = useQuery<Job[]>({
    queryKey: ['client-open-jobs-invite'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Job[] | { jobs: Job[] }>>('/jobs/my-jobs');
      const list = (Array.isArray(data.data) ? data.data : (data.data as any)?.jobs) || [];
      return list.filter((j: Job) => j.status === 'OPEN');
    },
  });

  // 4. Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiClient.delete(`/profiles/artisans/${artisanId}/save`);
      } else {
        await apiClient.post(`/profiles/artisans/${artisanId}/save`);
      }
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      queryClient.invalidateQueries({ queryKey: ['saved-artisans-ids'] });
    },
  });

  // 5. Send Job Invitation Mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobId || !artisan?.userId) return;
      await apiClient.post(`/jobs/${selectedJobId}/invite/${artisan.userId}`);
    },
    onSuccess: () => {
      setInviteModalOpen(false);
      setSelectedJobId('');
      alert('Job invitation sent successfully!');
    },
  });

  // 6. Direct Message Initiation
  const startChatMutation = useMutation({
    mutationFn: async () => {
      if (!artisan?.userId) return;
      const { data } = await apiClient.post<ApiResponse<{ conversation: { id: string } }>>(
        '/chat/conversations',
        { recipientId: artisan.userId }
      );
      return data.data.conversation;
    },
    onSuccess: (conversation) => {
      if (conversation?.id) {
        navigate(`/client/messages?conversationId=${conversation.id}`);
      } else {
        navigate('/client/messages');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="font-dashboard flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div className="font-dashboard text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Artisan Not Found
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {error ? getErrorMessage(error) : 'The requested artisan profile does not exist.'}
        </p>
        <Link
          to="/client/artisans"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  const displayName = artisan.businessName || artisan.user?.email?.split('@')[0] || 'Artisan';
  const openJobs = clientJobs || [];

  return (
    <div className="font-dashboard space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Back Button */}
      <div>
        <Link
          to="/client/artisans"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Artisan Directory</span>
        </Link>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <Avatar
              src={artisan.user?.avatarUrl}
              name={displayName}
              size="lg"
              isOnline={artisan.isAvailable}
              className="w-24 h-24 text-3xl shadow-sm border-2 border-emerald-800/10"
            />
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verified Artisan</span>
                </span>
                {artisan.isAvailable ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    Available for Hire
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                    Currently Busy
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
                {artisan.tagline || 'Professional tradesman dedicated to excellence, precision, and reliable service.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {artisan.lgaCity}, {artisan.state}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {Number(artisan.ratingAvg || 0).toFixed(1)} ({artisan.reviewCount || 0} reviews)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {artisan.completedJobsCount || 0} completed projects
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  {artisan.yearsOfExperience || 0} years experience
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-col items-center justify-center sm:items-end gap-3 shrink-0">
            <button
              onClick={() => setInviteModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Invite to Job</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => startChatMutation.mutate()}
                disabled={startChatMutation.isPending}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Message</span>
              </button>

              <button
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                className={`p-2.5 rounded-full border transition-all ${
                  isSaved
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 shadow-sm'
                }`}
                title={isSaved ? 'Remove Bookmark' : 'Save Artisan'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
              </button>

              <Link
                to={`/client/artisans/find?focusId=${artisan.id}`}
                className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-emerald-700 shadow-sm transition-all"
                title="View on Discovery Map"
              >
                <Compass className="w-4 h-4" />
              </Link>
            </div>

            {artisan.hourlyRate && (
              <div className="text-right hidden sm:block pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Starting Rate</span>
                <p className="text-base font-black text-slate-900">
                  {formatCurrency(artisan.hourlyRate)} / hr
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="p-1.5 bg-slate-100/80 rounded-2xl w-fit flex items-center gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview &amp; Bio
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'portfolio'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Portfolio</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'portfolio' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {artisan.portfolios?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'services'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Services Catalog</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'services' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {artisan.services?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Client Reviews</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {reviews?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* About / Bio */}
              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  About the Artisan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {artisan.bio || 'No detailed biography provided yet.'}
                </p>
              </div>

              {/* Skills & Expertise */}
              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  Skills &amp; Expertise
                </h3>
                {artisan.skills && artisan.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {artisan.skills.map((s) => (
                      <span
                        key={s.skill.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                      >
                        {s.skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No specific skills tagged.</p>
                )}
              </div>
            </div>

            {/* Right sidebar info */}
            <div className="space-y-6">
              <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Verification &amp; Badges
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Identity Verified
                      </p>
                      <p className="text-[11px] text-slate-500">Government ID &amp; KYC Approved</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Monad Escrow Ready
                      </p>
                      <p className="text-[11px] text-slate-500">Accepts Artifix smart contract payments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {(!artisan.portfolios || artisan.portfolios.length === 0) ? (
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 p-12 text-center">
                <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  No portfolio items uploaded yet
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This artisan hasn&apos;t added visual project case studies yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artisan.portfolios.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    {item.mediaUrls && item.mediaUrls.length > 0 ? (
                      <div
                        onClick={() => setLightboxImage(item.mediaUrls[0])}
                        className="relative h-48 bg-slate-100 cursor-pointer group overflow-hidden"
                      >
                        <img
                          src={item.mediaUrls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <ExternalLink className="w-4 h-4" />
                          <span>View Full Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        No image preview
                      </div>
                    )}
                    <div className="p-5 space-y-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-600 line-clamp-3">
                          {item.description}
                        </p>
                      )}
                      {item.completionDate && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Completed {formatDate(item.completionDate)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. SERVICES CATALOG TAB */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            {(!artisan.services || artisan.services.length === 0) ? (
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  No packaged services listed
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You can post a custom job and invite this artisan directly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artisan.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {service.deliveryDays} Days Turnaround
                        </span>
                        <span className="text-base font-black text-emerald-800">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {service.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setInviteModalOpen(true)}
                      className="w-full py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      Book / Request This Service
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {(!reviews || reviews.length === 0) ? (
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 p-12 text-center">
                <Star className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  No reviews yet
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Be the first client to hire this artisan and share your experience!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={rev.reviewer?.avatarUrl}
                          name={rev.reviewer?.clientProfile?.firstName || 'Client'}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {rev.reviewer?.clientProfile?.firstName
                              ? `${rev.reviewer.clientProfile.firstName} ${rev.reviewer.clientProfile.lastName || ''}`
                              : 'Verified Client'}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatDate(rev.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{rev.overallRating}.0</span>
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-slate-700 leading-relaxed">
                        &quot;{rev.comment}&quot;
                      </p>
                    )}

                    {/* Criteria breakdown */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      {rev.qualityRating && <span>Quality: ★ {rev.qualityRating}</span>}
                      {rev.communicationRating && <span>Communication: ★ {rev.communicationRating}</span>}
                      {rev.punctualityRating && <span>Punctuality: ★ {rev.punctualityRating}</span>}
                    </div>

                    {/* Artisan reply thread */}
                    {rev.artisanReply && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/50 border-l-4 border-emerald-700 text-xs space-y-1">
                        <p className="font-bold text-slate-900">
                          Artisan Response:
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          {rev.artisanReply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite to Job Modal */}
      {inviteModalOpen && (
        <Modal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          title={`Invite ${displayName} to a Job`}
        >
          <div className="font-dashboard space-y-4">
            <p className="text-xs text-slate-500">
              Select one of your open job postings to invite this artisan directly. They will receive an instant notification to submit their bid on Artifix.
            </p>

            {openJobs.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 text-xs space-y-2 border border-amber-200">
                <p className="font-bold">You have no open job postings.</p>
                <p>Create a new job posting first so you can invite this artisan.</p>
                <Link
                  to="/client/jobs/post"
                  className="inline-flex items-center gap-1 font-bold text-emerald-800 underline"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post a New Job</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {openJobs.map((job) => (
                  <label
                    key={job.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedJobId === job.id
                        ? 'border-emerald-800 bg-emerald-50/60 ring-2 ring-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Budget: {formatCurrency(job.budgetMin)} - {formatCurrency(job.budgetMax)}
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="selectedJob"
                      value={job.id}
                      checked={selectedJobId === job.id}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-4 h-4 text-emerald-800 focus:ring-emerald-700"
                    />
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                className="px-5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-full bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all active:scale-95"
                disabled={!selectedJobId || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white p-1 hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Portfolio Full View"
              className="w-full h-auto max-h-[85vh] object-contain rounded-[24px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
