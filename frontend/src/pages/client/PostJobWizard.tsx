import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  FileText,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { JobCategory, Skill, ApiResponse, Job } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { useAuthStore } from '../../stores/authStore';
import { trackEvent } from '../../lib/posthog';

export const PostJobWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [description, setDescription] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [materialsProvidedBy, setMaterialsProvidedBy] = useState('CLIENT_PROVIDES');
  const [completionProofReq, setCompletionProofReq] = useState('');
  const [state, setState] = useState('Lagos');
  const [lgaCity, setLgaCity] = useState('');
  const [address, setAddress] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [budgetType, setBudgetType] = useState<'FIXED' | 'MILESTONE_BASED' | 'HOURLY'>('FIXED');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [attachments, setAttachments] = useState<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Categories & Skills
  const { data: categories = [] } = useQuery<JobCategory[]>({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<JobCategory[] | { categories: JobCategory[] }>>('/jobs/categories');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.categories) || [];
    },
  });

  const selectedCategoryObj = categories?.find((c) => c.id === Number(categoryId));
  const availableSkills = selectedCategoryObj?.skills || [];

  // Toggle skill selection
  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  // 2. Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setErrorMessage('');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'job-attachments');

        const { data } = await apiClient.post<ApiResponse<{ url: string; bytes: number; format: string }>>(
          '/upload/single',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        setAttachments((prev) => [
          ...prev,
          {
            fileUrl: data.data.url,
            fileName: file.name,
            fileSizeBytes: data.data.bytes || file.size,
            mimeType: file.type || 'image/jpeg',
          },
        ]);
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Submit Mutation
  const createJobMutation = useMutation({
    mutationFn: async (status: 'OPEN' | 'DRAFT') => {
      const payload = {
        title,
        categoryId: Number(categoryId),
        description,
        expectedOutcome: expectedOutcome || undefined,
        materialsProvidedBy,
        state,
        lgaCity,
        address: address || undefined,
        budgetType,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        completionProofReq: completionProofReq || undefined,
        deadlineDate: deadlineDate || undefined,
        status,
        skillIds: selectedSkillIds,
        attachments: attachments.map((a) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSizeBytes: a.fileSizeBytes,
          mimeType: a.mimeType,
        })),
      };

      const { data } = await apiClient.post<ApiResponse<Job | { job: Job }>>('/jobs', payload);
      const createdJob = (data.data as any).id ? (data.data as Job) : (data.data as any).job;
      return createdJob;
    },
    onSuccess: (job) => {
      trackEvent('job_created', {
        job_id: job?.id,
        status: job?.status,
        category_id: Number(categoryId),
        budget_type: budgetType,
        budget_min: Number(budgetMin),
        budget_max: Number(budgetMax),
        skill_count: selectedSkillIds.length,
        attachment_count: attachments.length,
      });
      if (job?.id) {
        navigate(`/client/jobs/${job.id}`);
      } else {
        navigate('/client/jobs');
      }
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err));
    },
  });

  const steps = [
    { title: 'Basics & Category', description: 'Title & specialty' },
    { title: 'Project Scope', description: 'Deliverables & proof' },
    { title: 'Location & Dates', description: 'State & schedule' },
    { title: 'Budget & Payment', description: 'Estimated range' },
    { title: 'Attachments', description: 'Plans & photos' },
    { title: 'Review & Post', description: 'Summary' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 font-dashboard pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/client/jobs"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to My Jobs</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-dashboard">
            Post a New Job
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe your project, define the budget, and receive competitive bids from verified artisans.
          </p>
        </div>

        <button
          onClick={() => createJobMutation.mutate('DRAFT')}
          disabled={createJobMutation.isPending}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
        >
          Save as Draft
        </button>
      </div>

      {/* Stepper */}
      <div className="hidden sm:block">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {/* Role Alert if logged in as Artisan */}
      {user && user.role !== 'CLIENT' && user.role !== 'ADMIN' && (
        <div className="p-4 rounded-[20px] bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              You are currently signed in as an <strong>Artisan</strong> ({user.email}). Only <strong>Client</strong> accounts can post jobs.
            </span>
          </div>
          <Link
            to="/login"
            className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 inline-block text-center shadow-xs"
          >
            Switch to Client
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-[20px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Wizard Form Card */}
      <div className="p-8 rounded-[24px] bg-white border border-slate-100 shadow-xs space-y-6">
        {/* STEP 1: BASICS & CATEGORY */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 font-dashboard">
                Step 1: Job Title &amp; Category
              </h2>
              <p className="text-xs text-slate-500">
                Give your job a clear, descriptive headline so the right artisans find it.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Re-piping for 3-Bedroom Flat or Inverter Solar Installation"
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Job Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(Number(e.target.value));
                  setSelectedSkillIds([]);
                }}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 cursor-pointer"
              >
                <option value="">Select a category...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {availableSkills.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700">
                  Required Skills &amp; Specialties (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const isSelected = selectedSkillIds.includes(skill.id);
                    return (
                      <button
                        type="button"
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-600'
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROJECT SCOPE & DELIVERABLES */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 font-dashboard">
                Step 2: Project Scope &amp; Detailed Requirements
              </h2>
              <p className="text-xs text-slate-500">
                Provide full context on what needs to be fixed, constructed, or installed.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Detailed Job Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the exact issue, current condition of the site, special requirements, and any constraints..."
                className="w-full p-4 rounded-2xl bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 leading-relaxed placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Expected Deliverables / Outcome
              </label>
              <input
                type="text"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder="e.g. Zero leakages tested under pressure, fully functional inverter powering all lights..."
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Materials &amp; Supplies Responsibility
                </label>
                <select
                  value={materialsProvidedBy}
                  onChange={(e) => setMaterialsProvidedBy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 cursor-pointer"
                >
                  <option value="CLIENT_PROVIDES">I (Client) will provide all materials</option>
                  <option value="ARTISAN_PROVIDES">Artisan must supply all materials</option>
                  <option value="SHARED">To be negotiated / Shared</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Proof of Work Verification
                </label>
                <input
                  type="text"
                  value={completionProofReq}
                  onChange={(e) => setCompletionProofReq(e.target.value)}
                  placeholder="e.g. High-res before/after photos and on-site testing"
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & SCHEDULE */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 font-dashboard">
                Step 3: Location &amp; Completion Target
              </h2>
              <p className="text-xs text-slate-500">
                Where will the job take place and when do you need it completed?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 cursor-pointer"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja (FCT)</option>
                  <option value="Rivers">Rivers (Port Harcourt)</option>
                  <option value="Oyo">Oyo (Ibadan)</option>
                  <option value="Ogun">Ogun</option>
                  <option value="Enugu">Enugu</option>
                  <option value="Anambra">Anambra</option>
                  <option value="Kano">Kano</option>
                  <option value="Kaduna">Kaduna</option>
                  <option value="Edo">Edo</option>
                  <option value="Delta">Delta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  LGA / City / Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lgaCity}
                  onChange={(e) => setLgaCity(e.target.value)}
                  placeholder="e.g. Lekki Phase 1, Ikeja, Maitama, Wuse 2"
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Street Address (Visible only to hired artisan)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 14, Admiralty Way, Lekki"
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Target Deadline Date
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET & PAYMENT */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 font-dashboard">
                Step 4: Budget &amp; Escrow Structure
              </h2>
              <p className="text-xs text-slate-500">
                Set realistic expectations to attract experienced artisans.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Payment Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'FIXED', title: 'Fixed Price', desc: 'Single fixed fee' },
                  { type: 'MILESTONE_BASED', title: 'Milestones', desc: 'Staged escrow releases' },
                  { type: 'HOURLY', title: 'Hourly Rate', desc: 'Based on logged hours' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => setBudgetType(item.type as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      budgetType === item.type
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold font-dashboard">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Minimum Estimated Budget (NGN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Maximum Estimated Budget (NGN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white border border-slate-200 text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: ATTACHMENTS & PHOTOS */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 font-dashboard">
                Step 5: Photos, Plans &amp; Schematics
              </h2>
              <p className="text-xs text-slate-500">
                Upload clear pictures or blueprints of the work area to help artisans quote accurately.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-[20px] p-8 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                {isUploading ? 'Uploading files...' : 'Click to browse or drag and drop images'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, PDF up to 10MB</p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="mt-4 text-xs mx-auto cursor-pointer block text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Uploaded Files</label>
                <div className="space-y-2">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
                        <span className="truncate font-medium text-slate-800">{att.fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1 hover:text-rose-600 text-slate-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: REVIEW & PUBLISH */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 font-dashboard">
                Step 6: Review &amp; Post Job
              </h2>
              <p className="text-xs text-slate-500">
                Please verify all specifications before making the job live for bidding.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {selectedCategoryObj?.name || 'Category'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 font-dashboard">
                    {title}
                  </h3>
                  <p className="text-slate-500 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {lgaCity}, {state}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget</span>
                  <p className="text-base font-black text-slate-900 font-dashboard">
                    {formatCurrency(budgetMin)} – {formatCurrency(budgetMax)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Description:</span>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {description}
                </p>
              </div>

              {selectedSkillIds.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Selected Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSkills
                      .filter((s) => selectedSkillIds.includes(s.id))
                      .map((s) => (
                        <span
                          key={s.id}
                          className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-semibold text-slate-700"
                        >
                          {s.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700">
                    Attachments ({attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-700"
                      >
                        {att.fileName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                setCurrentStep((prev) => prev - 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                if (currentStep === 1 && (!title || !categoryId)) {
                  setErrorMessage('Please provide a job title and category.');
                  return;
                }
                if (currentStep === 2 && !description) {
                  setErrorMessage('Please provide a detailed job description.');
                  return;
                }
                if (currentStep === 3 && !lgaCity) {
                  setErrorMessage('Please specify the City / Area location.');
                  return;
                }
                if (currentStep === 4 && (!budgetMin || !budgetMax)) {
                  setErrorMessage('Please provide both minimum and maximum budget estimates.');
                  return;
                }
                setCurrentStep((prev) => prev + 1);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              disabled={createJobMutation.isPending}
              onClick={() => createJobMutation.mutate('OPEN')}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-8 py-2.5 rounded-full text-xs shadow-xs transition-colors cursor-pointer"
            >
              {createJobMutation.isPending ? 'Publishing...' : 'Publish Job Live'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
