import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Image,
  Upload,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../lib/formatters';
import { ArtisanPortfolio } from '../../types';

export const PortfolioPage: React.FC = () => {
  const { user } = useAuthStore();
  const [portfolios, setPortfolios] = useState<ArtisanPortfolio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndPortfolios = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/auth/me');
      setPortfolios(data.data?.artisanProfile?.portfolios || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPortfolios();
  }, [user?.id]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      formData.append('folder', 'portfolio');

      const { data } = await apiClient.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const urls = data.data.map((item: { url: string }) => item.url);
      setMediaUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      alert(`Upload failed: ${getErrorMessage(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { data } = await apiClient.post('/profiles/artisan/portfolio', {
        title,
        description,
        completionDate: completionDate ? new Date(completionDate).toISOString() : undefined,
        mediaUrls,
      });

      setPortfolios((prev) => [data.data, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setCompletionDate('');
      setMediaUrls([]);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!window.confirm('Delete this portfolio project?')) return;
    try {
      await apiClient.delete(`/profiles/artisan/portfolio/${portfolioId}`);
      setPortfolios((prev) => prev.filter((p) => p.id !== portfolioId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Portfolio Showcase ({portfolios.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Display high-resolution photos and project summaries of past work to attract clients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/artisan/profile">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Profile Settings
            </Button>
          </Link>
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Project
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8" />}
          title="No portfolio items added yet"
          description="Upload photos of your best electrical, plumbing, carpentry, or masonry work to build trust."
          actionLabel="Add First Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {portfolios.map((item) => (
            <Card key={item.id} className="p-0 overflow-hidden flex flex-col justify-between group">
              <div className="space-y-3">
                {item.mediaUrls && item.mediaUrls.length > 0 ? (
                  <img
                    src={item.mediaUrls[0]}
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Image className="w-8 h-8" />
                  </div>
                )}

                <div className="p-4 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  {item.completionDate && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Completed {formatDate(item.completionDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 flex justify-end">
                <button
                  onClick={() => handleDeletePortfolio(item.id)}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Portfolio Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Project to Portfolio"
        description="Showcase completed deliverables and project accomplishments."
      >
        <form onSubmit={handleAddPortfolio} className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g. 5kVA Solar Inverter & Battery Bank Setup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Project Overview & Materials Used"
            rows={3}
            placeholder="Describe what was executed, components installed, testing done..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            label="Completion Date"
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Project Photos (Upload Up to 5)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleMediaUpload}
              className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
            />
            {mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {mediaUrls.map((url, i) => (
                  <img key={i} src={url} alt="Media" className="w-16 h-16 object-cover rounded-xl border" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving || isUploading}>
              Publish to Portfolio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
