export type CommissionTerms = {
  commissionType: "PERCENTAGE" | "FIXED" | "HYBRID";
  commissionPercent: number | null;
  commissionFixedFee: number | null;
};

/** doc §37: percentage, fixed fee, or both. Never charges more than the gross itself. */
export function computeCommission(gross: number, terms: CommissionTerms): number {
  const percent = Number(terms.commissionPercent ?? 0);
  const fixed = Number(terms.commissionFixedFee ?? 0);

  let commission: number;
  switch (terms.commissionType) {
    case "FIXED":
      commission = fixed;
      break;
    case "HYBRID":
      commission = gross * (percent / 100) + fixed;
      break;
    case "PERCENTAGE":
    default:
      commission = gross * (percent / 100);
      break;
  }

  return Math.min(Math.max(commission, 0), gross);
}
