import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Send,
  Download,
  CheckCircle,
  FileText,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../lib/api-client';
import { formatNgn, formatDate } from '../../lib/formatters';
import { Job } from '../../types';

export const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        setIsLoading(true);
        const { data } = await apiClient.get(`/jobs/${jobId}`);
        setJob(data.data);
      } catch (err) {
        console.error('Failed to load job details', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const toggleSave = async () => {
    if (!jobId) return;
    try {
      if (isSaved) {
        await apiClient.delete(`/jobs/${jobId}/save`);
        setIsSaved(false);
      } else {
        await apiClient.post(`/jobs/${jobId}/save`);
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-500">Job posting not found or has been removed.</p>
        <Button onClick={() => navigate('/artisan/jobs')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/artisan/jobs')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </button>

      {/* Main Job Overview Card */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {job.category?.name}
              </span>
              <Badge status={job.status}>{job.status}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.lgaCity}, {job.state}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Posted on {formatDate(job.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Deadline: {formatDate(job.deadlineDate)}
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Estimated Budget ({job.budgetType})
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatNgn(job.budgetMin)} - {formatNgn(job.budgetMax)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSave}
                leftIcon={
                  isSaved ? (
                    <BookmarkCheck className="w-4 h-4 text-sky-500" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )
                }
              >
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Link to={`/artisan/jobs/${job.id}/propose`}>
                <Button size="sm" leftIcon={<Send className="w-4 h-4" />}>
                  Submit Proposal
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Job Brief */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Job Scope & Project Description
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {/* Expected Outcome & Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Expected Deliverable
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {job.expectedOutcome || 'Standard high-quality trade execution'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Materials Provided By
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {job.materialsProvidedBy || 'To be aligned during proposal submission'}
            </p>
          </div>
        </div>

        {/* Required Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Required Trade Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span
                  key={s.skill.id}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80"
                >
                  {s.skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attachments / Blueprints */}
        {job.attachments && job.attachments.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Attached Plans, Photos & Blueprints ({job.attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {att.fileName}
                    </span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
