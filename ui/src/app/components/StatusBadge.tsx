'use client';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CLASSES: Record<string, string> = {
  'CREATED': 'status-new',
  'PENDING_OPERATOR_ACTION': 'status-open',
  'APPROVED': 'status-open',
  'REJECTED': 'status-closed',
  'AWAITING_PAYMENT': 'status-open',
  'PAID': 'status-open',
  'ASSIGNED': 'status-open',
  'PICKED_UP': 'status-open',
  'IN_TRANSIT': 'status-open',
  'DELIVERED': 'status-resolved',
  'COMPLETED': 'status-resolved',
  'CANCELLED': 'status-closed',
  'FAILED': 'status-closed',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusClass = STATUS_CLASSES[status] || 'status-new';
  const displayStatus = status.replace(/_/g, ' ');

  return (
    <span className={`status-badge ${statusClass} ${className}`}>
      {displayStatus}
    </span>
  );
}

