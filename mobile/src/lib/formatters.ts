export const formatCurrency = (amount: number, currency: 'NGN' | 'MON' = 'NGN'): string => {
  if (currency === 'MON') {
    return `${amount.toFixed(2)} MON`;
  }
  return `₦${amount.toLocaleString('en-NG')}`;
};

export const formatDistance = (distanceKm?: number): string => {
  if (distanceKm === undefined || distanceKm === null) return 'Nearby';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
};
