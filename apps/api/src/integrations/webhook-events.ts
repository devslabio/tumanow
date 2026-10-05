/** Event catalogue (doc §51). Kept as a flat list rather than a DB enum so new events don't need a migration. */
export const WEBHOOK_EVENTS = [
  "shipment.created",
  "shipment.approved",
  "shipment.rejected",
  "shipment.picked_up",
  "shipment.in_transit",
  "shipment.out_for_delivery",
  "shipment.delivered",
  "shipment.cancelled",
  "shipment.failed",
  "shipment.returned",
  "shipment.retry_scheduled",
  "payment.completed",
  "payment.failed",
  "driver.assigned",
  "quote.created",
  "quote.accepted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Maps a ShipmentStatus onto its webhook event name, where one exists. */
export const SHIPMENT_STATUS_WEBHOOK_EVENT: Partial<Record<string, WebhookEvent>> = {
  APPROVED: "shipment.approved",
  REJECTED: "shipment.rejected",
  PICKED_UP: "shipment.picked_up",
  IN_TRANSIT: "shipment.in_transit",
  OUT_FOR_DELIVERY: "shipment.out_for_delivery",
  DELIVERED: "shipment.delivered",
  CANCELLED: "shipment.cancelled",
  FAILED: "shipment.failed",
  RETURNED: "shipment.returned",
};
