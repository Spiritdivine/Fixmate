import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Briefcase,
  MapPin,
  Sparkles,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { JobCategory } from '../../types';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const profile = user?.artisanProfile;

  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [tagline, setTagline] = useState(profile?.tagline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(String(profile?.yearsOfExperience || 3));
  const [hourlyRate, setHourlyRate] = useState(String(profile?.hourlyRate || '5000'));
  const [state, setState] = useState(profile?.state || 'Lagos');
  const [lgaCity, setLgaCity] = useState(profile?.lgaCity || 'Ikeja');
  const [address, setAddress] = useState(profile?.address || '');
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>(
    (profile?.skills || []).map((s) => s.skill.id)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/jobs/categories');
        setCategories(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const uploadRes = await apiClient.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const avatarUrl = uploadRes.data.data.url;
      await apiClient.patch('/profiles/avatar', { avatarUrl });
      updateUser({ avatarUrl });
      setMessage('Avatar photo updated successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage(null);
      setError(null);

      const { data } = await apiClient.patch('/profiles/artisan', {
        businessName,
        tagline,
        bio,
        yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
        hourlyRate: parseFloat(hourlyRate) || 0,
        state,
        lgaCity,
        address,
        skillIds: selectedSkills,
      });

      if (walletAddress && walletAddress !== user?.walletAddress) {
        await apiClient.patch('/profiles/wallet-address', { walletAddress });
        updateUser({ walletAddress });
      }

      updateUser({ artisanProfile: data.data });
      setMessage('Artisan profile details updated successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Artisan Profile & Trade Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Keep your skills, location, bio, and portfolio updated to rank higher in client search discovery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/artisan/profile/portfolio">
            <Button variant="outline" size="sm" leftIcon={<Layers className="w-4 h-4" />}>
              Portfolio Showcase
            </Button>
          </Link>
          <Link to="/artisan/profile/services">
            <Button variant="outline" size="sm" leftIcon={<ShoppingBag className="w-4 h-4" />}>
              Service Catalog
            </Button>
          </Link>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Avatar & Business Header Card */}
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <Avatar
                src={user?.avatarUrl}
                name={businessName || user?.email || 'Artisan'}
                size="xl"
              />
              <label
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px] font-bold"
                title="Change Avatar"
              >
                <Camera className="w-5 h-5 mb-1" />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <Input
                label="Business or Workshop Name"
                placeholder="e.g. Masterfix Electricals & Solar"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />

              <Input
                label="Professional Tagline"
                placeholder="e.g. Certified Inverter, Wiring & Smart Home Specialist"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
          </div>

          <Textarea
            label="Artisan Biography & Overview"
            rows={4}
            placeholder="Describe your background, years of trade experience, special tools/equipment owned, safety precautions..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Years of Experience"
              type="number"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
            />
            <Input
              label="Base Hourly Rate (₦ / hr)"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </div>
        </Card>

        {/* Trade Category & Specialized Skills */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Trade Category & Specialized Skills</CardTitle>
            <CardDescription>Select all skill tags relevant to your trade to receive matched invitations.</CardDescription>
          </CardHeader>

          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {cat.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cat.skills?.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.id);
                    return (
                      <button
                        type="button"
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-500'
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Location & Physical Workshop Address */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Operating Location & Workshop Address</CardTitle>
            <CardDescription>Clients search for nearby artisans based on State and LGA.</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
            <Input
              label="LGA or City"
              value={lgaCity}
              onChange={(e) => setLgaCity(e.target.value)}
              required
            />
          </div>

          <Input
            label="Workshop or Office Address"
            placeholder="e.g. 14 Awolowo Way, Ikeja, Lagos"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Card>

        {/* Monad Web3 Blockchain Address Binding */}
        <Card className="space-y-4 border-purple-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <CardTitle className="text-purple-400">Monad Testnet EVM Wallet</CardTitle>
                <CardDescription>Link your EVM address to receive direct smart contract escrow payouts.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <Input
            label="Monad EVM Wallet Address (0x...)"
            placeholder="0x71C...3a9B"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </Card>

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="w-full"
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Artisan Profile
        </Button>
      </form>
    </div>
  );
};
