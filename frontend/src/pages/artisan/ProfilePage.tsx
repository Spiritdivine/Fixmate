import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
 User,
 Briefcase,
 MapPin,
 
 Camera,
 Save,
 CheckCircle2,
 AlertCircle,
 ExternalLink,
 Layers,
 ShoppingBag,
 Copy,
 CheckCircle,
 ShieldCheck,
 Wallet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { WorkshopLocationCard } from '../../components/artisan/WorkshopLocationCard';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { JobCategory } from '../../types';

export const ProfilePage: React.FC = () => {
 const { user, updateUser } = useAuthStore();
 const profile = user?.artisanProfile;

 const [firstName, setFirstName] = useState(profile?.firstName || '');
 const [lastName, setLastName] = useState(profile?.lastName || '');
 const [businessName, setBusinessName] = useState(profile?.businessName || '');
 const [tagline, setTagline] = useState(profile?.tagline || '');
 const [bio, setBio] = useState(profile?.bio || '');
 const [yearsOfExperience, setYearsOfExperience] = useState(String(profile?.yearsOfExperience || 3));
 const [hourlyRate, setHourlyRate] = useState(String(profile?.hourlyRate || '5000'));
 const [state, setState] = useState(profile?.state || 'Lagos');
 const [lgaCity, setLgaCity] = useState(profile?.lgaCity || 'Ikeja');
 const [address, setAddress] = useState(profile?.address || '');
 const [latitude, setLatitude] = useState<number | null>(
  profile?.latitude !== null && profile?.latitude !== undefined
   ? Number(profile.latitude)
   : null
 );
 const [longitude, setLongitude] = useState<number | null>(
  profile?.longitude !== null && profile?.longitude !== undefined
   ? Number(profile.longitude)
   : null
 );
 const [categories, setCategories] = useState<JobCategory[]>([]);
 const [selectedSkills, setSelectedSkills] = useState<number[]>(
  (profile?.skills || []).map((s) => s.skill.id)
 );

 useEffect(() => {
  if (profile?.latitude !== undefined && profile?.latitude !== null) {
   setLatitude(Number(profile.latitude));
  }
  if (profile?.longitude !== undefined && profile?.longitude !== null) {
   setLongitude(Number(profile.longitude));
  }
 }, [profile?.latitude, profile?.longitude]);

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
 firstName: firstName.trim() || undefined,
 lastName: lastName.trim() || undefined,
 businessName,
 tagline,
 bio,
 yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
 hourlyRate: parseFloat(hourlyRate) || 0,
 state,
 lgaCity,
 address,
 latitude: latitude !== null && !isNaN(latitude) ? Number(latitude) : undefined,
 longitude: longitude !== null && !isNaN(longitude) ? Number(longitude) : undefined,
  skillIds: selectedSkills,
 });

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
 <div className="p-4 rounded-[24px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" />
 <span>{message}</span>
 </div>
 )}

 {error && (
 <div className="p-4 rounded-[24px] bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
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
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input
 label="First Name"
 placeholder="e.g. Babatunde"
 value={firstName}
 onChange={(e) => setFirstName(e.target.value)}
 required
 />
 <Input
 label="Last Name"
 placeholder="e.g. Adeleke"
 value={lastName}
 onChange={(e) => setLastName(e.target.value)}
 />
 </div>

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
 ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
 : 'bg-white text-slate-700 dark:text-slate-300 border-slate-200 hover:border-emerald-600'
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

        {/* Workshop Location & Interactive Map Pin-Drop */}
        <WorkshopLocationCard
          latitude={latitude}
          longitude={longitude}
          state={state}
          lgaCity={lgaCity}
          address={address}
          onCoordinatesChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
          onAddressFill={({ state: s, lgaCity: l, address: a }) => {
            if (s) setState(s);
            if (l) setLgaCity(l);
            if (a) setAddress(a);
          }}
          onStateChange={setState}
          onLgaCityChange={setLgaCity}
          onAddressChange={setAddress}
        />

 {/* Monad Web3 Blockchain Account (Read-Only Permanent Privy Embedded Wallet) */}
 <Card className="space-y-4 border-purple-500/30">
 <CardHeader>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Wallet className="w-5 h-5 text-purple-400" />
 <div>
 <CardTitle className="text-purple-400">Monad Payout Account</CardTitle>
 <CardDescription>Your permanent, self-custodial Monad address for direct smart contract escrow payouts.</CardDescription>
 </div>
 </div>
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
 <ShieldCheck className="w-3.5 h-3.5" />
 Privy Embedded
 </span>
 </div>
 </CardHeader>

 <div className="px-6 pb-6">
 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
 Permanent EVM Address
 </label>
 <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 text-sm font-mono text-slate-200 break-all">
 <span>{user?.walletAddress || 'Provisioning embedded wallet...'}</span>
 {user?.walletAddress && (
 <div className="flex items-center gap-2 shrink-0 ml-3">
 <button
 type="button"
 onClick={() => {
 navigator.clipboard.writeText(user.walletAddress || '');
 setMessage('Wallet address copied to clipboard!');
 }}
 className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-700"
 title="Copy Address"
 >
 <Copy className="w-4 h-4" />
 </button>
 <a
 href={`https://testnet.monadvision.com/address/${user.walletAddress}`}
 target="_blank"
 rel="noopener noreferrer"
 className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-purple-400 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
 title="View on MonadVision"
 >
 <ExternalLink className="w-4 h-4" />
 </a>
 </div>
 )}
 </div>
 </div>
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
