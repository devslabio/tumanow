/**
 * Standardized failed-delivery reason codes (see product doc §30 "Failed Delivery").
 * Kept as a validated free-text list rather than a DB enum so new reasons can be
 * added without a migration — validation happens at the DTO layer.
 */
export const FAILURE_REASONS = [
  "CUSTOMER_UNAVAILABLE",
  "RECIPIENT_UNAVAILABLE",
  "WRONG_ADDRESS",
  "RECIPIENT_REFUSED",
  "PACKAGE_DAMAGED",
  "PACKAGE_LOST",
  "VEHICLE_BREAKDOWN",
  "DRIVER_UNAVAILABLE",
  "BAD_WEATHER",
  "ROAD_INACCESSIBLE",
  "PAYMENT_PROBLEM",
  "PACKAGE_EXCEEDS_LIMITS",
  "SECURITY_ISSUE",
  "OTHER",
] as const;

export type FailureReasonCode = (typeof FAILURE_REASONS)[number];
