import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Trash2,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Job, JobCategory, ApiResponse } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const EditJobPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [title, setTitle] = useState('');
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

  // 1. Fetch Job
  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ['client-edit-job', jobId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Job | { job: Job }>>(`/jobs/${jobId}`);
      return (data.data as any)?.id ? (data.data as Job) : (data.data as any)?.job;
    },
    enabled: !!jobId,
  });

  useEffect(() => {
    if (job) {
      setTitle(job.title || '');
      setDescription(job.description || '');
      setExpectedOutcome(job.expectedOutcome || '');
      setMaterialsProvidedBy(job.materialsProvidedBy || 'CLIENT_PROVIDES');
      setCompletionProofReq(job.completionProofReq || '');
      setState(job.state || 'Lagos');
      setLgaCity(job.lgaCity || '');
      setAddress(job.address || '');
      if (job.deadlineDate) {
        setDeadlineDate(job.deadlineDate.split('T')[0]);
      }
      setBudgetType(job.budgetType || 'FIXED');
      setBudgetMin(String(job.budgetMin || ''));
      setBudgetMax(String(job.budgetMax || ''));
    }
  }, [job]);

  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description,
        expectedOutcome: expectedOutcome || undefined,
        materialsProvidedBy,
        completionProofReq: completionProofReq || undefined,
        state,
        lgaCity,
        address: address || undefined,
        deadlineDate: deadlineDate || undefined,
        budgetType,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
      };
      await apiClient.patch(`/jobs/${jobId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-job-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
      navigate(`/client/jobs/${jobId}`);
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err));
    },
  });

  // 3. Delete Attachment Mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await apiClient.delete(`/jobs/${jobId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-edit-job', jobId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium tracking-wide">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl pb-16 font-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={`/client/jobs/${jobId}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Job Overview
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Job Listing</h1>
          <p className="text-sm text-slate-500">Update specifications, escrow budget, and requirements for this job.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detailed Description</label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">City / LGA</label>
            <input
              type="text"
              value={lgaCity}
              onChange={(e) => setLgaCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Materials Provided By</label>
            <select
              value={materialsProvidedBy}
              onChange={(e) => setMaterialsProvidedBy(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
            >
              <option value="CLIENT_PROVIDES">Client Provides All Materials</option>
              <option value="ARTISAN_PROVIDES">Artisan Supplies Materials</option>
              <option value="NEGOTIABLE">Negotiable / Shared Purchase</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Budget Structure</label>
            <select
              value={budgetType}
              onChange={(e) => setBudgetType(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
            >
              <option value="FIXED">Fixed Price Project</option>
              <option value="MILESTONE_BASED">Milestone-Based Escrow</option>
              <option value="HOURLY">Hourly / Daily Rate</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Expected Deliverables &amp; Outcome
          </label>
          <textarea
            rows={3}
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
            placeholder="e.g. Fully installed 5kVA inverter system with battery bank wiring"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Completion Proof Requirements
          </label>
          <textarea
            rows={2}
            value={completionProofReq}
            onChange={(e) => setCompletionProofReq(e.target.value)}
            placeholder="e.g. Before and after photos of DB panel, voltage testing report"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Min Budget (NGN)</label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Max Budget (NGN)</label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Deadline Date</label>
          <input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-slate-900 transition-all outline-none"
          />
        </div>

        {/* Existing Attachments */}
        {job?.attachments && job.attachments.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attached Files
            </label>
            <div className="space-y-2">
              {job.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {att.fileName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAttachmentMutation.mutate(att.id)}
                    disabled={deleteAttachmentMutation.isPending}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(`/client/jobs/${jobId}`)}
            className="px-6 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            className="px-7 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-900/10 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
