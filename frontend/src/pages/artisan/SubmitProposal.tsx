import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatNgn } from '../../lib/formatters';
import { Job } from '../../types';

interface MilestoneInput {
  stepOrder: number;
  title: string;
  amount: string;
  estimatedDays: string;
}

export const SubmitProposal: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('7');
  const [coverLetter, setCoverLetter] = useState('');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { stepOrder: 1, title: 'Phase 1: Initial Setup & Materials Procured', amount: '', estimatedDays: '3' },
    { stepOrder: 2, title: 'Phase 2: Final Installation & Testing Deliverable', amount: '', estimatedDays: '4' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const { data } = await apiClient.get(`/jobs/${jobId}`);
        setJob(data.data);
        if (data.data.budgetMin) {
          setBidAmount(String(data.data.budgetMin));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchJob();
  }, [jobId]);

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        stepOrder: prev.length + 1,
        title: `Phase ${prev.length + 1}: Next Deliverable`,
        amount: '',
        estimatedDays: '3',
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) =>
      prev.filter((_, idx) => idx !== index).map((m, idx) => ({ ...m, stepOrder: idx + 1 }))
    );
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
    setMilestones((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, [field]: value } : m))
    );
  };

  const milestoneSum = milestones.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalBidNumeric = parseFloat(bidAmount) || 0;
  const isSumMatched = totalBidNumeric > 0 && Math.abs(milestoneSum - totalBidNumeric) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    if (!bidAmount || totalBidNumeric <= 0) {
      setError('Please provide a valid bid amount in Naira');
      return;
    }

    if (!isSumMatched && milestones.length > 0) {
      setError(
        `Milestone sum (${formatNgn(milestoneSum)}) does not equal total bid amount (${formatNgn(
          totalBidNumeric
        )}). Please adjust the milestone amounts.`
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await apiClient.post('/proposals', {
        jobId,
        bidAmount: totalBidNumeric,
        estimatedDays: parseInt(estimatedDays, 10) || 7,
        coverLetter,
        milestones: milestones.map((m) => ({
          stepOrder: m.stepOrder,
          title: m.title,
          amount: parseFloat(m.amount),
          estimatedDays: parseInt(m.estimatedDays, 10) || 1,
        })),
      });

      navigate('/artisan/proposals');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
          Proposal Submission
        </span>
        <h1 className="text-xl font-bold">{job?.title || 'Job Proposal'}</h1>
        <p className="text-xs text-slate-400">
          Client Budget: {formatNgn(job?.budgetMin)} - {formatNgn(job?.budgetMax)}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Pricing & Timing Card */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Bid Terms & Overall Timeline</CardTitle>
            <CardDescription>Specify your total project quotation in Nigerian Naira.</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Quotation Amount (₦)"
              type="number"
              placeholder="e.g. 50000"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              leftIcon={<span className="text-sm font-bold">₦</span>}
              required
            />
            <Input
              label="Total Estimated Duration (Days)"
              type="number"
              placeholder="e.g. 7"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
          </div>

          <Textarea
            label="Cover Letter / Proposal Narrative"
            rows={5}
            placeholder="Explain your approach, why you are qualified, equipment you bring, and how you will guarantee top quality work..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            required
          />
        </Card>

        {/* Milestone Breakdown Builder */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Milestone Escrow Schedule</CardTitle>
              <CardDescription>
                Break down work into verifiable deliverable milestones. Funds unlock as each milestone is approved.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMilestone}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Milestone
            </Button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Milestone #{m.stepOrder}
                  </span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Milestone deliverable title (e.g. Phase 1 Piping & Rough-in)"
                      value={m.title}
                      onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Amount (₦)"
                      type="number"
                      value={m.amount}
                      onChange={(e) => updateMilestone(idx, 'amount', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sum Validator Card */}
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              isSumMatched
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isSumMatched ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>
                Milestones Total: {formatNgn(milestoneSum)} / Bid Total: {formatNgn(totalBidNumeric)}
              </span>
            </div>
            <span>{isSumMatched ? 'Balanced' : 'Sum Mismatch'}</span>
          </div>
        </Card>

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          disabled={!isSumMatched}
          className="w-full"
          rightIcon={<Send className="w-4 h-4" />}
        >
          Submit Official Escrow Proposal
        </Button>
      </form>
    </div>
  );
};
