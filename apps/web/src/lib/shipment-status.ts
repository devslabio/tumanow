const LABELS: Record<string, string> = {
  CREATED: "Created",
  PENDING_OPERATOR_ACTION: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  RETURNED: "Returned",
};

const BADGE: Record<string, string> = {
  CREATED: "tn-badge-neutral",
  PENDING_OPERATOR_ACTION: "tn-badge-warning",
  APPROVED: "tn-badge-success",
  REJECTED: "tn-badge-neutral",
  AWAITING_PAYMENT: "tn-badge-warning",
  PAID: "tn-badge-success",
  ASSIGNED: "tn-badge-orange",
  PICKED_UP: "tn-badge-orange",
  IN_TRANSIT: "tn-badge-orange",
  OUT_FOR_DELIVERY: "tn-badge-orange",
  DELIVERED: "tn-badge-success",
  COMPLETED: "tn-badge-success",
  CANCELLED: "tn-badge-neutral",
  FAILED: "tn-badge-neutral",
  RETURNED: "tn-badge-warning",
};

export function shipmentStatusLabel(status: string) {
  return LABELS[status] ?? status;
}

export function shipmentStatusBadgeClass(status: string) {
  return BADGE[status] ?? "tn-badge-neutral";
}
