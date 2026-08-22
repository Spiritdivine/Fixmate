import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Trash2, Edit2, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatNgn } from '../../lib/formatters';
import { useAuthStore } from '../../stores/authStore';
import { ArtisanService } from '../../types';

export const ServicesCatalogPage: React.FC = () => {
  const { user } = useAuthStore();
  const [services, setServices] = useState<ArtisanService[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileServices = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/auth/me');
      setServices(data.data?.artisanProfile?.services || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileServices();
  }, [user?.id]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { data } = await apiClient.post('/profiles/artisan/services', {
        title,
        description,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays, 10) || 1,
        isActive: true,
      });

      setServices((prev) => [data.data, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setDeliveryDays('1');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Delete this packaged service?')) return;
    try {
      await apiClient.delete(`/profiles/artisan/services/${serviceId}`);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Packaged Services Catalog ({services.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Offer fixed-price turnkey trade services that clients can book directly with one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/artisan/profile">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Profile Settings
            </Button>
          </Link>
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Service Package
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="No packaged services listed yet"
          description="Create packaged service offerings (e.g. 'Complete AC Servicing & Gas Refill', 'Distribution Board Overhaul')."
          actionLabel="Create First Package"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatNgn(s.price)}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {s.deliveryDays} Day Turnaround
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{s.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">{s.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteService(s.id)}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Fixed-Price Packaged Service"
        description="Define a packaged offering with fixed pricing and turnaround duration."
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <Input
            label="Service Title"
            placeholder="e.g. Full Air Conditioning Deep Cleaning & Gas Top-up"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="What is Included in This Package"
            rows={3}
            placeholder="Outline the exact deliverables, cleaning agents provided, safety checks included..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fixed Price (₦)"
              type="number"
              placeholder="e.g. 25000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Estimated Turnaround (Days)"
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Publish Service Package
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
