import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Check, X, ArrowLeft, Send, MapPin, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../lib/api-client';
import { formatNgn, formatDate } from '../../lib/formatters';
import { JobInvitation } from '../../types';

export const JobInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/jobs/invitations/my-invitations');
      setInvitations(data.data || []);
    } catch (err) {
      console.error('Failed to load invitations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const respondToInvitation = async (invitationId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      await apiClient.patch(`/jobs/invitations/${invitationId}/respond`, { status });
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, status } : inv))
      );
    } catch (err) {
      console.error('Failed to respond to invitation', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Direct Job Invitations ({invitations.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Clients who selected your profile and invited you directly to execute their project.
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
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-8 h-8" />}
          title="No invitations received yet"
          description="Maintain high review ratings and an updated portfolio to get direct invitations from clients."
        />
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <Card key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge status={inv.status}>{inv.status}</Badge>
                  <span className="text-xs text-slate-500">
                    Invited on {formatDate(inv.createdAt)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {inv.job?.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {inv.job?.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {inv.job?.lgaCity}, {inv.job?.state}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Budget: {formatNgn(inv.job?.budgetMin)} - {formatNgn(inv.job?.budgetMax)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                {inv.status === 'PENDING' ? (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => respondToInvitation(inv.id, 'DECLINED')}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Decline
                    </Button>
                    <Link to={`/artisan/jobs/${inv.jobId}/propose`}>
                      <Button
                        size="sm"
                        onClick={() => respondToInvitation(inv.id, 'ACCEPTED')}
                        leftIcon={<Send className="w-4 h-4" />}
                      >
                        Accept & Bid
                      </Button>
                    </Link>
                  </>
                ) : inv.status === 'ACCEPTED' ? (
                  <Link to={`/artisan/jobs/${inv.jobId}/propose`}>
                    <Button size="sm" leftIcon={<Send className="w-4 h-4" />}>
                      Submit Proposal
                    </Button>
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold uppercase">Declined</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
