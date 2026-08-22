import React, { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  FolderTree,
  Users,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { ApiResponse, Skill } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export const SkillsManagerPage: React.FC = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSkillsAndCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [skillsRes, catRes] = await Promise.all([
        apiClient.get<ApiResponse<any[]>>('/admin/skills'),
        apiClient.get<ApiResponse<any[]>>('/admin/categories'),
      ]);

      if (skillsRes.data.success) setSkills(skillsRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillsAndCategories();
  }, []);

  const openCreateModal = () => {
    setEditingSkill(null);
    setName('');
    setSlug('');
    setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
    setModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingSkill(s);
    setName(s.name);
    setSlug(s.slug);
    setCategoryId(s.categoryId.toString());
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingSkill) {
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
    if (!name.trim() || !slug.trim() || !categoryId) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        categoryId: Number(categoryId),
      };

      if (editingSkill) {
        const res = await apiClient.put<ApiResponse<any>>(`/admin/skills/${editingSkill.id}`, payload);
        if (res.data.success) {
          setSkills((prev) => prev.map((s) => (s.id === editingSkill.id ? res.data.data : s)));
          setModalOpen(false);
        }
      } else {
        const res = await apiClient.post<ApiResponse<any>>('/admin/skills', payload);
        if (res.data.success) {
          setSkills((prev) => [...prev, res.data.data]);
          setModalOpen(false);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (skillId: number) => {
    if (!window.confirm('Are you sure you want to delete this skill tag?')) return;
    try {
      const res = await apiClient.delete<ApiResponse<any>>(`/admin/skills/${skillId}`);
      if (res.data.success) {
        setSkills((prev) => prev.filter((s) => s.id !== skillId));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredSkills = skills.filter((s) => {
    const matchesCat =
      selectedCategoryFilter === 'ALL' || s.categoryId.toString() === selectedCategoryFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-400" />
            <span>Standardized Skills Catalog</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Define specialized trade skills available for artisan profiles and job matching.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Skill Tag
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search skill name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          aria-label="Parent Category Filter"
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
        >
          <option value="ALL">All Trade Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id.toString()}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Skills Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Skill Title</th>
                <th className="py-3.5 px-4">URL Slug</th>
                <th className="py-3.5 px-4">Parent Category</th>
                <th className="py-3.5 px-4">Artisans Offering</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading skills...
                  </td>
                </tr>
              ) : filteredSkills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No skills found.
                  </td>
                </tr>
              ) : (
                filteredSkills.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-400">
                      {s.slug}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950 border border-slate-800 text-slate-300">
                        {s.category?.name || 'Category'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-400">{s._count?.artisans || 0} Artisans</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(s)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(s.id)}
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSkill ? 'Edit Skill Tag' : 'Create New Skill Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Skill Name"
            placeholder="e.g. Inverter Installation & Maintenance"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />

          <Input
            label="Skill Slug"
            placeholder="e.g. inverter-installation"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />

          <div>
            <label className="block font-bold text-slate-300 mb-1">Parent Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} className="bg-purple-600 text-white font-bold">
              {editingSkill ? 'Save Changes' : 'Create Skill'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
