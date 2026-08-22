import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Briefcase,
  MapPin,
  Clock,
  Send,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../lib/api-client';
import { formatNgn, formatDate } from '../../lib/formatters';
import { Job, JobCategory } from '../../types';

export const JobsMarketplace: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const statesList = [
    { value: '', label: 'All Locations / States' },
    { value: 'Lagos', label: 'Lagos State' },
    { value: 'Abuja (FCT)', label: 'Abuja (FCT)' },
    { value: 'Rivers', label: 'Rivers State' },
    { value: 'Oyo', label: 'Oyo State' },
    { value: 'Enugu', label: 'Enugu State' },
    { value: 'Kano', label: 'Kano State' },
    { value: 'Delta', label: 'Delta State' },
  ];

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedState) params.append('state', selectedState);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);

      const [jobsRes, catRes, savedRes] = await Promise.all([
        apiClient.get(`/jobs?${params.toString()}`),
        apiClient.get('/jobs/categories'),
        apiClient.get('/jobs/saved').catch(() => ({ data: { data: [] } })),
      ]);

      setJobs(jobsRes.data.data.jobs || []);
      setCategories(catRes.data.data || []);
      const savedIds = new Set<string>((savedRes.data.data || []).map((j: Job) => j.id));
      setSavedJobIds(savedIds);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, selectedState]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const toggleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        await apiClient.delete(`/jobs/${jobId}/save`);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        await apiClient.post(`/jobs/${jobId}/save`);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.add(jobId);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle save job', err);
    }
  };

  const categoryOptions = [
    { value: '', label: 'All Trade Categories' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Job Opportunities Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Discover verified jobs with escrow-guaranteed funds. Submit competitive milestone proposals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/artisan/jobs/saved">
            <Button variant="outline" size="sm" leftIcon={<Bookmark className="w-4 h-4" />}>
              Saved ({savedJobIds.size})
            </Button>
          </Link>
          <Link to="/artisan/jobs/invitations">
            <Button variant="outline" size="sm" leftIcon={<Briefcase className="w-4 h-4" />}>
              Invitations
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <Card className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search jobs by keywords (e.g. Electrical rewiring, Plumbing leak, Solar inverter)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <Button type="submit" size="md">
              Search Marketplace
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
            <Select
              options={statesList}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Min Budget (₦)"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max Budget (₦)"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            />
          </div>
        </form>
      </Card>

      {/* Jobs Grid Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-8 h-8" />}
          title="No open jobs matched your search criteria"
          description="Try broadening your filters, choosing a different location, or clearing search keywords."
          actionLabel="Reset Search Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('');
            setSelectedState('');
            setMinBudget('');
            setMaxBudget('');
            fetchJobs();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const isSaved = savedJobIds.has(job.id);

            return (
              <Card key={job.id} hoverable className="flex flex-col justify-between group space-y-4">
                <div className="space-y-3">
                  {/* Top Bar: Category & Save Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 truncate">
                      {job.category?.name || 'General Trade'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSaveJob(job.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={isSaved ? 'Unsave Job' : 'Save Job'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-5 h-5 text-sky-500 fill-sky-500" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <Link to={`/artisan/jobs/${job.id}`}>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-500 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                      {job.description}
                    </p>
                  </div>

                  {/* Skills tags */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((s) => (
                        <span
                          key={s.skill.id}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Meta & Proposal CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.lgaCity}, {job.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.proposalsCount} Proposals</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Budget ({job.budgetType})
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatNgn(job.budgetMin)} - {formatNgn(job.budgetMax)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/artisan/jobs/${job.id}`}>
                        <Button variant="secondary" size="sm">
                          Details
                        </Button>
                      </Link>
                      <Link to={`/artisan/jobs/${job.id}/propose`}>
                        <Button size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                          Bid
                        </Button>
                      </Link>
                    </div>
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
