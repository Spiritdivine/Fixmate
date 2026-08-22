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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <Link
          to={`/client/jobs/${jobId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Cancel and Return to Job</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
          Edit Job Posting
        </h1>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State</label>
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">City / LGA</label>
            <input
              type="text"
              value={lgaCity}
              onChange={(e) => setLgaCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Materials Provided By</label>
            <select
              value={materialsProvidedBy}
              onChange={(e) => setMaterialsProvidedBy(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            >
              <option value="CLIENT_PROVIDES">Client Provides All Materials</option>
              <option value="ARTISAN_PROVIDES">Artisan Supplies Materials</option>
              <option value="NEGOTIABLE">Negotiable / Shared Purchase</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Budget Structure</label>
            <select
              value={budgetType}
              onChange={(e) => setBudgetType(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            >
              <option value="FIXED">Fixed Price Project</option>
              <option value="MILESTONE_BASED">Milestone-Based Escrow</option>
              <option value="HOURLY">Hourly / Daily Rate</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Expected Deliverables &amp; Outcome
          </label>
          <textarea
            rows={3}
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
            placeholder="e.g. Fully installed 5kVA inverter system with battery bank wiring"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Completion Proof Requirements
          </label>
          <textarea
            rows={2}
            value={completionProofReq}
            onChange={(e) => setCompletionProofReq(e.target.value)}
            placeholder="e.g. Before and after photos of DB panel, voltage testing report"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Min Budget (NGN)</label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Budget (NGN)</label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deadline Date</label>
          <input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Existing Attachments */}
        {job?.attachments && job.attachments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Attached Files
            </label>
            <div className="space-y-2">
              {job.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {att.fileName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAttachmentMutation.mutate(att.id)}
                    disabled={deleteAttachmentMutation.isPending}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Delete attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/client/jobs/${jobId}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
