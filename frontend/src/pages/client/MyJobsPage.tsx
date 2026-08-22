import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  XCircle,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Job, JobStatus, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const MyJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Client's Jobs
  const { data: jobsData = [], isLoading } = useQuery<Job[]>({
    queryKey: ['client-my-jobs', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'ALL' ? '/jobs/my-jobs' : `/jobs/my-jobs?status=${selectedStatus}`;
      const { data } = await apiClient.get<ApiResponse<Job[] | { jobs: Job[] }>>(url);
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.jobs) || [];
    },
  });

  // 2. Delete Job Mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!confirm('Are you sure you want to delete this job posting?')) return;
      await apiClient.delete(`/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
    },
  });

  // 3. Update Job Status Mutation (e.g. Cancel or Complete)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      await apiClient.patch(`/jobs/${jobId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
    },
  });

  const jobs = (jobsData || []).filter((j) =>
    searchQuery
      ? j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.lgaCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.state.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const statusFilters = [
    { label: 'All Jobs', value: 'ALL' },
    { label: 'Open for Bidding', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Drafts', value: 'DRAFT' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            My Job Postings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your repair requests, inspect incoming proposals, and track active contracts.
          </p>
        </div>

        <Link
          to="/client/jobs/post"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition-all active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a New Job</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusFilters.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs by title, LGA, or state..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-6 border-slate-200 dark:border-slate-800 animate-pulse h-36" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No job postings found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedStatus === 'ALL'
              ? 'You have not posted any jobs yet. Create a job posting to connect with skilled artisans.'
              : `No jobs found with status "${selectedStatus}".`}
          </p>
          <Link
            to="/client/jobs/post"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post a Job</span>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const badgeVariant =
              job.status === 'OPEN'
                ? 'blue'
                : job.status === 'IN_PROGRESS'
                ? 'emerald'
                : job.status === 'COMPLETED'
                ? 'emerald'
                : job.status === 'DRAFT'
                ? 'amber'
                : 'slate';

            return (
              <Card
                key={job.id}
                className="p-5 sm:p-6 hover:border-sky-500/40 transition-all border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeVariant as any}>{job.status}</Badge>
                    <span className="text-xs text-slate-400">
                      Posted {formatDate(job.createdAt)}
                    </span>
                    {job.category && (
                      <span className="text-xs font-medium text-slate-500">
                        • {job.category.name}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/client/jobs/${job.id}`}
                    className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors block truncate"
                  >
                    {job.title}
                  </Link>

                  <p className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.lgaCity}, {job.state}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(job.budgetMin)} – {formatCurrency(job.budgetMax)}
                    </span>
                    {job.deadlineDate && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Deadline: {formatDate(job.deadlineDate)}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Right Actions & Proposal Badge */}
                <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800">
                    <Users className="w-3.5 h-3.5" />
                    <span>{job.proposalsCount} Proposals Received</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/client/jobs/${job.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-sky-600 dark:hover:bg-sky-500 text-white dark:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
                    >
                      View Details &amp; Bids
                    </Link>

                    {job.status === 'OPEN' && (
                      <Link
                        to={`/client/jobs/${job.id}/edit`}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Edit Job"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}

                    {(job.status === 'OPEN' || job.status === 'DRAFT') && (
                      <button
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        disabled={deleteJobMutation.isPending}
                        className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
