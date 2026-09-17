import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Search,
  Users,
  MapPin,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Job, JobStatus, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Badge } from '../../components/ui/Badge';

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
    <div className="space-y-6 animate-in fade-in duration-300 font-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-dashboard">
            My Job Postings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your repair requests, inspect incoming proposals, and track active contracts.
          </p>
        </div>

        <Link
          to="/client/jobs/post"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a New Job</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {statusFilters.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === tab.value
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 bg-white hover:bg-slate-50 shadow-xs border border-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs by title, LGA, or state..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white text-sm font-medium border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none shadow-xs text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 bg-white rounded-[24px] border border-slate-100 animate-pulse h-36 shadow-xs" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[24px] border border-dashed border-slate-200 shadow-xs">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No job postings found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedStatus === 'ALL'
              ? 'You have not posted any jobs yet. Create a job posting to connect with skilled artisans.'
              : `No jobs found with status "${selectedStatus}".`}
          </p>
          <Link
            to="/client/jobs/post"
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post a Job</span>
          </Link>
        </div>
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
              <div
                key={job.id}
                className="p-6 rounded-[24px] bg-white border border-slate-100 hover:border-emerald-500/30 hover:shadow-md transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6"
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
                    className="text-base font-bold text-slate-900 hover:text-emerald-800 transition-colors block truncate"
                  >
                    {job.title}
                  </Link>

                  <p className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.lgaCity}, {job.state}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-800">
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
                <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
                    <Users className="w-3.5 h-3.5" />
                    <span>{job.proposalsCount} Proposals Received</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/client/jobs/${job.id}`}
                      className="px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      View Details &amp; Bids
                    </Link>

                    {job.status === 'OPEN' && (
                      <Link
                        to={`/client/jobs/${job.id}/edit`}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Edit Job"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}

                    {(job.status === 'OPEN' || job.status === 'DRAFT') && (
                      <button
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        disabled={deleteJobMutation.isPending}
                        className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
