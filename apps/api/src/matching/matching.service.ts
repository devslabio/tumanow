import { Injectable } from "@nestjs/common";
import { DeliveryService, Prisma } from "@prisma/client";

import { haversineKm } from "../common/geo";
import { PrismaService } from "../prisma/prisma.service";

export type MatchQuoteInput = {
  pickupCity: string;
  deliveryCity: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
  isFragile?: boolean;
  isPerishable?: boolean;
  deliveryService?: DeliveryService;
  estimatedDistanceKm?: number;
  packageTypeId?: string;
  operatorId?: string;
};

export type MatchQuoteResult = {
  operatorId: string;
  operatorCode: string;
  tradingName: string | null;
  legalName: string;
  currency: string;
  price: number;
  pricingRuleId: string | null;
  deliveryService: DeliveryService;
  estimatedDistanceKm: number;
  /** True for the lowest-priced offer in the result set. */
  cheapest: boolean;
  /** Cheapest offer among operators with an operator-specific pricing rule for this request. */
  recommended: boolean;
};

type CoverageAreaRow = {
  name: string;
  level: string;
  config: Prisma.JsonValue;
};

type PackageTypeRow = {
  id: string;
  maxWeightKg: Prisma.Decimal | null;
  maxLengthCm: Prisma.Decimal | null;
  maxWidthCm: Prisma.Decimal | null;
  maxHeightCm: Prisma.Decimal | null;
  isActive: boolean;
};

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async match(input: MatchQuoteInput): Promise<MatchQuoteResult[]> {
    const deliveryService = input.deliveryService ?? "STANDARD";
    const weightKg = input.weightKg ?? 1;
    const isFragile = input.isFragile ?? false;
    const distanceKm = this.resolveDistanceKm(input);

    const operators = await this.prisma.operator.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...(input.operatorId ? { id: input.operatorId } : {}),
      },
      include: {
        coverageAreas: {
          where: { deletedAt: null, isActive: true },
        },
        pricingRules: {
          where: { deletedAt: null, isActive: true },
        },
        packageTypes: {
          where: { isActive: true },
        },
      },
    });

    const results: (MatchQuoteResult & { hasRealRule: boolean })[] = [];

    for (const op of operators) {
      if (
        !this.coversLocation(op.coverageAreas, {
          city: input.pickupCity,
          lat: input.pickupLat,
          lng: input.pickupLng,
        }) ||
        !this.coversLocation(op.coverageAreas, {
          city: input.deliveryCity,
          lat: input.deliveryLat,
          lng: input.deliveryLng,
        })
      ) {
        continue;
      }

      if (!this.acceptsPackage(op.packageTypes, input)) {
        continue;
      }

      const rule = this.pickPricingRule(
        op.pricingRules,
        deliveryService,
        input.packageTypeId,
        weightKg,
      );

      const price = rule
        ? this.computeFromRule(rule, distanceKm, weightKg, isFragile, deliveryService)
        : this.fallbackPrice(distanceKm, isFragile);

      results.push({
        operatorId: op.id,
        operatorCode: op.code,
        tradingName: op.tradingName,
        legalName: op.legalName,
        currency: op.currency,
        price,
        pricingRuleId: rule?.id ?? null,
        deliveryService,
        estimatedDistanceKm: Math.round(distanceKm * 10) / 10,
        cheapest: false,
        recommended: false,
        // A real pricing rule (vs. the generic fallback estimate) is a
        // stronger signal that the operator has actually priced this route.
        hasRealRule: rule != null,
      });
    }

    results.sort((a, b) => a.price - b.price);
    if (results.length) {
      results[0].cheapest = true;
      const bestPriced = results.find((r) => r.hasRealRule) ?? results[0];
      bestPriced.recommended = true;
    }

    return results.map(({ hasRealRule, ...r }) => r);
  }

  async priceForOperator(
    operatorId: string,
    input: Omit<MatchQuoteInput, "operatorId">,
  ): Promise<number> {
    const matches = await this.match({ ...input, operatorId });
    if (matches.length) return matches[0].price;
    return this.fallbackPrice(
      this.resolveDistanceKm(input),
      input.isFragile ?? false,
    );
  }

  /** Prefers a real great-circle distance when both endpoints have coordinates. */
  resolveDistanceKm(input: MatchQuoteInput): number {
    if (
      input.pickupLat != null &&
      input.pickupLng != null &&
      input.deliveryLat != null &&
      input.deliveryLng != null
    ) {
      const km = haversineKm(
        { lat: input.pickupLat, lng: input.pickupLng },
        { lat: input.deliveryLat, lng: input.deliveryLng },
      );
      // Straight-line distance undershoots actual road distance; pad it
      // until real routing is integrated.
      return Math.max(1, km * 1.3);
    }
    return input.estimatedDistanceKm ?? 5;
  }

  /**
   * An operator with no configured package types is treated as unrestricted
   * (consistent with "no coverage areas configured" meaning nationwide).
   * Once types are configured, the request must fit within the largest
   * limit the operator offers across its active types.
   */
  acceptsPackage(types: PackageTypeRow[], input: MatchQuoteInput): boolean {
    if (input.packageTypeId) {
      const owned = types.find((t) => t.id === input.packageTypeId);
      if (!owned) return false;
    }

    if (!types.length) return true;

    const maxOf = (pick: (t: PackageTypeRow) => Prisma.Decimal | null) => {
      const values = types
        .map(pick)
        .filter((v): v is Prisma.Decimal => v != null)
        .map((v) => Number(v));
      return values.length ? Math.max(...values) : null;
    };

    const maxWeight = maxOf((t) => t.maxWeightKg);
    if (maxWeight != null && input.weightKg != null && input.weightKg > maxWeight) {
      return false;
    }
    const maxLength = maxOf((t) => t.maxLengthCm);
    if (maxLength != null && input.lengthCm != null && input.lengthCm > maxLength) {
      return false;
    }
    const maxWidth = maxOf((t) => t.maxWidthCm);
    if (maxWidth != null && input.widthCm != null && input.widthCm > maxWidth) {
      return false;
    }
    const maxHeight = maxOf((t) => t.maxHeightCm);
    if (maxHeight != null && input.heightCm != null && input.heightCm > maxHeight) {
      return false;
    }
    return true;
  }

  /**
   * Coverage hierarchy: country/province/district/sector match by name
   * (best-effort — the API only carries a city string today, not a full
   * address hierarchy). city matches by name or config.city. zone/radius
   * match by great-circle distance from a configured center when the
   * shipment has coordinates, otherwise fall back to name matching.
   * An operator with no active coverage areas is treated as nationwide.
   */
  coversLocation(
    areas: CoverageAreaRow[],
    point: { city: string; lat?: number; lng?: number },
  ): boolean {
    if (!areas.length) return true;
    const needle = point.city?.trim().toLowerCase() ?? "";

    return areas.some((area) => {
      const cfg = (area.config ?? {}) as Record<string, unknown>;
      const level = area.level.toLowerCase();

      if (level === "country") return true;

      if (level === "zone" || level === "radius") {
        const lat = typeof cfg.lat === "number" ? cfg.lat : undefined;
        const lng = typeof cfg.lng === "number" ? cfg.lng : undefined;
        const radiusKm = typeof cfg.radiusKm === "number" ? cfg.radiusKm : undefined;
        if (lat != null && lng != null && radiusKm != null && point.lat != null && point.lng != null) {
          return haversineKm({ lat, lng }, { lat: point.lat, lng: point.lng }) <= radiusKm;
        }
        // No coordinates on either side — fall through to name matching.
      }

      if (!needle) return false;
      const cfgValue = cfg[level] ?? cfg.city;
      if (typeof cfgValue === "string" && cfgValue.toLowerCase() === needle) {
        return true;
      }
      return area.name.toLowerCase().includes(needle);
    });
  }

  pickPricingRule(
    rules: {
      id: string;
      deliveryService: DeliveryService;
      packageTypeId: string | null;
      baseFee: Prisma.Decimal;
      perKmFee: Prisma.Decimal;
      perKgFee: Prisma.Decimal;
      fragileSurcharge: Prisma.Decimal;
      expressSurcharge: Prisma.Decimal;
      minFee: Prisma.Decimal | null;
      maxWeightKg: Prisma.Decimal | null;
    }[],
    deliveryService: DeliveryService,
    packageTypeId?: string,
    weightKg?: number,
  ) {
    const candidates = rules.filter((r) => {
      if (r.deliveryService !== deliveryService) return false;
      if (packageTypeId && r.packageTypeId && r.packageTypeId !== packageTypeId) {
        return false;
      }
      if (
        weightKg != null &&
        r.maxWeightKg != null &&
        weightKg > Number(r.maxWeightKg)
      ) {
        return false;
      }
      return true;
    });

    if (!candidates.length) {
      return (
        rules.find((r) => r.deliveryService === deliveryService && !r.packageTypeId) ??
        rules.find((r) => r.deliveryService === "STANDARD" && !r.packageTypeId) ??
        rules[0] ??
        null
      );
    }

    const exactPkg = packageTypeId
      ? candidates.find((r) => r.packageTypeId === packageTypeId)
      : null;
    return exactPkg ?? candidates.find((r) => !r.packageTypeId) ?? candidates[0];
  }

  computeFromRule(
    rule: {
      baseFee: Prisma.Decimal;
      perKmFee: Prisma.Decimal;
      perKgFee: Prisma.Decimal;
      fragileSurcharge: Prisma.Decimal;
      expressSurcharge: Prisma.Decimal;
      minFee: Prisma.Decimal | null;
    },
    distanceKm: number,
    weightKg: number,
    isFragile: boolean,
    deliveryService: DeliveryService,
  ): number {
    let price =
      Number(rule.baseFee) +
      Number(rule.perKmFee) * distanceKm +
      Number(rule.perKgFee) * weightKg;
    if (isFragile) price += Number(rule.fragileSurcharge);
    if (
      deliveryService === "EXPRESS" ||
      deliveryService === "SAME_DAY" ||
      deliveryService === "NEXT_DAY"
    ) {
      price += Number(rule.expressSurcharge);
    }
    if (rule.minFee != null) {
      price = Math.max(price, Number(rule.minFee));
    }
    return Math.round(price);
  }

  fallbackPrice(distanceKm: number, isFragile: boolean): number {
    const base = 2000;
    const perKm = 500;
    const fragile = isFragile ? 1000 : 0;
    return Math.round(base + distanceKm * perKm + fragile);
  }
}
