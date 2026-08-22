import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Briefcase,
  Layers,
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
      setErrorMessage(`Upload error: ${getErrorMessage(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // 3. Create Job Mutation
  const createJobMutation = useMutation({
    mutationFn: async (status: 'OPEN' | 'DRAFT') => {
      if (!title || !categoryId || !description || !budgetMin || !budgetMax || !lgaCity) {
        throw new Error('Please fill in all required fields before submitting.');
      }

      const payload = {
        title,
        categoryId: Number(categoryId),
        description,
        budgetType,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        state,
        lgaCity,
        address: address || undefined,
        expectedOutcome: expectedOutcome || undefined,
        materialsProvidedBy,
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/client/jobs"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to My Jobs</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Post a New Job
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Describe your project, define the budget, and receive competitive bids from verified artisans.
          </p>
        </div>

        <button
          onClick={() => createJobMutation.mutate('DRAFT')}
          disabled={createJobMutation.isPending}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
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
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              You are currently signed in as an <strong>Artisan</strong> ({user.email}). Only <strong>Client</strong> accounts can post jobs.
            </span>
          </div>
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 inline-block text-center"
          >
            Switch to Client
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Wizard Form Card */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-6">
        {/* STEP 1: BASICS & CATEGORY */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 1: Job Title &amp; Category
              </h2>
              <p className="text-xs text-slate-500">
                Give your job a clear, descriptive headline so the right artisans find it.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Re-piping for 3-Bedroom Flat or Inverter Solar Installation"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Job Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(Number(e.target.value));
                  setSelectedSkillIds([]);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-500'
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
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 2: Project Scope &amp; Detailed Requirements
              </h2>
              <p className="text-xs text-slate-500">
                Provide full context on what needs to be fixed, constructed, or installed.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detailed Job Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the exact issue, current condition of the site, special requirements, and any constraints..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Expected Deliverables / Outcome
              </label>
              <input
                type="text"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder="e.g. Zero leakages tested under pressure, fully functional inverter powering all lights..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Materials &amp; Supplies Responsibility
                </label>
                <select
                  value={materialsProvidedBy}
                  onChange={(e) => setMaterialsProvidedBy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="CLIENT_PROVIDES">I (Client) will provide all materials</option>
                  <option value="ARTISAN_PROVIDES">Artisan must supply all materials</option>
                  <option value="SHARED">To be negotiated / Shared</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Proof of Work Verification
                </label>
                <input
                  type="text"
                  value={completionProofReq}
                  onChange={(e) => setCompletionProofReq(e.target.value)}
                  placeholder="e.g. High-res before/after photos and on-site testing"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & SCHEDULE */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 3: Location &amp; Completion Target
              </h2>
              <p className="text-xs text-slate-500">
                Where will the job take place and when do you need it completed?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  LGA / City / Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lgaCity}
                  onChange={(e) => setLgaCity(e.target.value)}
                  placeholder="e.g. Lekki Phase 1, Ikeja, Maitama, Wuse 2"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Street Address (Visible only to hired artisan)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 14, Admiralty Way, Lekki"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Deadline Date
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET & PAYMENT */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 4: Budget &amp; Escrow Structure
              </h2>
              <p className="text-xs text-slate-500">
                Set realistic expectations to attract experienced artisans.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                    className={`p-3 rounded-xl border text-left transition-all ${
                      budgetType === item.type
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Minimum Estimated Budget (NGN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Maximum Estimated Budget (NGN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {budgetMin && budgetMax && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Estimated Range:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {formatCurrency(budgetMin)} – {formatCurrency(budgetMax)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: ATTACHMENTS & MEDIA */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 5: Project Photos, Blueprints &amp; Specs
              </h2>
              <p className="text-xs text-slate-500">
                Upload photos of the current damage, floor plans, or equipment specifications.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-sky-500 transition-colors">
              <input
                type="file"
                multiple
                id="file-upload"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-600 mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isUploading ? 'Uploading files...' : 'Click to browse or drag and drop files'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, PDF up to 15MB each
                  </p>
                </div>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Attached Files ({attachments.length})
                </h4>
                <div className="space-y-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {att.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({(att.fileSizeBytes / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
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
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 6: Review &amp; Post Job
              </h2>
              <p className="text-xs text-slate-500">
                Please verify all specifications before making the job live for bidding.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    {selectedCategoryObj?.name || 'Category'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
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
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(budgetMin)} – {formatCurrency(budgetMax)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Description:</span>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                  {description}
                </p>
              </div>

              {selectedSkillIds.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Selected Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSkills
                      .filter((s) => selectedSkillIds.includes(s.id))
                      .map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                        >
                          {s.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Attachments ({attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorMessage('');
                setCurrentStep((prev) => prev - 1);
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Previous</span>
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <Button
              type="button"
              size="sm"
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
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={createJobMutation.isPending}
              onClick={() => createJobMutation.mutate('OPEN')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6"
            >
              {createJobMutation.isPending ? 'Publishing...' : 'Publish Job Live'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
