export function formatNgn(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '₦0';
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return '₦0';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric).replace('NGN', '₦');
}

export const formatCurrency = formatNgn;

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

export function shortenAddress(address: string | undefined | null): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'RELEASED':
    case 'SUCCESS':
    case 'COMPLETED':
      return 'badge-emerald';
    case 'PENDING':
    case 'PENDING_FUNDING':
    case 'IN_PROGRESS':
    case 'SUBMITTED':
    case 'SHORTLISTED':
    case 'PROCESSING':
    case 'UNDER_REVIEW':
      return 'badge-amber';
    case 'FUNDED':
    case 'OPEN':
      return 'badge-blue';
    case 'REJECTED':
    case 'DISPUTED':
    case 'FAILED':
    case 'CANCELLED':
    case 'SUSPENDED':
    case 'WITHDRAWN':
      return 'badge-rose';
    default:
      return 'badge-purple';
  }
}
