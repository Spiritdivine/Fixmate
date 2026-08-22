import React, { useEffect, useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Tag,
  Briefcase,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { ApiResponse, JobCategory } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export const CategoriesManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [iconUrl, setIconUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<ApiResponse<any[]>>('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setParentId('');
    setIconUrl('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId ? cat.parentId.toString() : '');
    setIconUrl(cat.iconUrl || '');
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        parentId: parentId ? Number(parentId) : null,
        iconUrl: iconUrl.trim() || null,
        isActive,
      };

      if (editingCategory) {
        const res = await apiClient.put<ApiResponse<any>>(`/admin/categories/${editingCategory.id}`, payload);
        if (res.data.success) {
          setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? res.data.data : c)));
          setModalOpen(false);
        }
      } else {
        const res = await apiClient.post<ApiResponse<any>>('/admin/categories', payload);
        if (res.data.success) {
          setCategories((prev) => [...prev, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (catId: number) => {
    if (!window.confirm('Are you sure you want to deactivate this category?')) return;
    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/admin/categories/${catId}`);
      if (res.data.success) {
        setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, isActive: false } : c)));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-purple-400" />
            <span>Job Categories & Taxonomy Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Organize trade hierarchies, assign skill sets, and manage marketplace discovery categories.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Category
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search category name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading categories...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
          No categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    <p className="text-[11px] font-mono text-purple-400 mt-0.5">/{cat.slug}</p>
                  </div>
                  <Badge variant={cat.isActive ? 'success' : 'default'} size="sm">
                    {cat.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    <span>{cat.skills?.length || cat._count?.skills || 0} Skills</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span>{cat._count?.jobs || 0} Jobs</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(cat)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                {cat.isActive && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeactivate(cat.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Category Name"
            placeholder="e.g. Plumbing & Pipe Fitting"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />

          <Input
            label="URL Slug (Auto-generated)"
            placeholder="e.g. plumbing-pipe-fitting"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />

          <div>
            <label className="block font-bold text-slate-300 mb-1">Parent Category (Optional)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
            >
              <option value="">None (Top-Level Category)</option>
              {categories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <Input
            label="Icon URL or SVG Name (Optional)"
            placeholder="https://... or icon identifier"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isActiveToggle" className="font-semibold text-slate-300 cursor-pointer">
              Active & Publicly Available in Marketplace
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} className="bg-purple-600 text-white font-bold">
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
