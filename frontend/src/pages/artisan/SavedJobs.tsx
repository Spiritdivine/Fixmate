import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Send, Trash2, ArrowLeft, Briefcase } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../lib/api-client';
import { formatNgn } from '../../lib/formatters';
import { Job } from '../../types';

export const SavedJobs: React.FC = () => {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedJobs = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/jobs/saved');
      setSavedJobs(data.data || []);
    } catch (err) {
      console.error('Failed to load saved jobs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = async (jobId: string) => {
    try {
      await apiClient.delete(`/jobs/${jobId}/save`);
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error('Failed to unsave job', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Bookmarked Opportunities ({savedJobs.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Jobs you saved to apply for or review later.
          </p>
        </div>
        <Link to="/artisan/jobs">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Marketplace
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : savedJobs.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8" />}
          title="No bookmarked jobs yet"
          description="Browse the marketplace and click the bookmark icon on jobs you want to save."
          actionLabel="Explore Jobs"
          onAction={() => window.location.href = '/artisan/jobs'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((job) => (
            <Card key={job.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    {job.category?.name || 'General Trade'}
                  </span>
                  <button
                    onClick={() => handleUnsave(job.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">{job.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Budget</span>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
