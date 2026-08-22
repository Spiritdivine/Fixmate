import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Camera,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { IdDocumentType, KycStatus, KycVerification } from '../../types';

export const KycVerificationPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [documentType, setDocumentType] = useState<IdDocumentType>('NIN');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFrontUrl, setDocumentFrontUrl] = useState('');
  const [documentBackUrl, setDocumentBackUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const documentTypes = [
    { value: 'NIN', label: 'National Identification Number (NIN Slip)' },
    { value: 'BVN', label: 'Bank Verification Number (BVN Document)' },
    { value: 'DRIVERS_LICENSE', label: "FRSC Driver's License" },
    { value: 'VOTERS_CARD', label: "INEC Permanent Voter's Card (PVC)" },
    { value: 'INTERNATIONAL_PASSPORT', label: 'Nigerian International Passport' },
  ];

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'front' | 'back' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'kyc-documents');

      const { data } = await apiClient.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = data.data.url;
      if (field === 'front') setDocumentFrontUrl(url);
      if (field === 'back') setDocumentBackUrl(url);
      if (field === 'selfie') setSelfieUrl(url);
    } catch (err) {
      alert(`Upload failed: ${getErrorMessage(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentFrontUrl || !selfieUrl) {
      setError('Please upload both your ID card front photo and your live selfie photo.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await apiClient.post('/profiles/kyc', {
        documentType,
        documentNumber,
        documentFrontUrl,
        documentBackUrl: documentBackUrl || undefined,
        selfieUrl,
      });

      setSuccess('KYC submission received! Our compliance team will verify your documents within 2-4 hours.');
      updateUser({ isKycVerified: false });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Artisan Identity & KYC Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Identity-verified artisans receive the Verified Shield badge, higher search ranking, and instant escrow payouts.
        </p>
      </div>

      {/* Verification Status Card */}
      <Card
        className={`border ${
          user?.isKycVerified
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                user?.isKycVerified
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : 'bg-amber-500/20 text-amber-500'
              }`}
            >
              {user?.isKycVerified ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {user?.isKycVerified
                  ? 'Identity Fully Verified'
                  : 'KYC Verification Pending / Required'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.isKycVerified
                  ? 'Your identity documents have been approved by Fixmate Compliance.'
                  : 'Submit a valid government-issued ID to unlock verified status.'}
              </p>
            </div>
          </div>

          <Badge variant={user?.isKycVerified ? 'emerald' : 'amber'}>
            {user?.isKycVerified ? 'Verified' : 'Pending'}
          </Badge>
        </div>
      </Card>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!user?.isKycVerified && (
        <form onSubmit={handleSubmitKyc} className="space-y-6">
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Government Identification Details</CardTitle>
              <CardDescription>Select your document type and enter your identification number.</CardDescription>
            </CardHeader>

            <Select
              label="Document Type"
              options={documentTypes}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as IdDocumentType)}
            />

            <Input
              label="Document / Identification Number"
              placeholder="e.g. 11-digit NIN or Driver's License Number"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
            />
          </Card>

          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Document Photo & Selfie Verification</CardTitle>
              <CardDescription>Ensure text is clear and all four corners of the ID card are visible.</CardDescription>
            </CardHeader>

            {/* Front Photo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                ID Document (Front Photo) *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'front')}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                />
                {documentFrontUrl && (
                  <img
                    src={documentFrontUrl}
                    alt="Front"
                    className="w-16 h-12 object-cover rounded-lg border border-emerald-500"
                  />
                )}
              </div>
            </div>

            {/* Back Photo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                ID Document (Back Photo - Optional)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'back')}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                />
                {documentBackUrl && (
                  <img
                    src={documentBackUrl}
                    alt="Back"
                    className="w-16 h-12 object-cover rounded-lg border border-emerald-500"
                  />
                )}
              </div>
            </div>

            {/* Live Selfie */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Live Clear Selfie Photo *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'selfie')}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                />
                {selfieUrl && (
                  <img
                    src={selfieUrl}
                    alt="Selfie"
                    className="w-14 h-14 object-cover rounded-full border border-emerald-500"
                  />
                )}
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting || isUploading}
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Submit for Identity Verification
          </Button>
        </form>
      )}
    </div>
  );
};
