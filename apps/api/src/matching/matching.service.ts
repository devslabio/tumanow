import { Injectable } from "@nestjs/common";
import { DeliveryService, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

export type MatchQuoteInput = {
  pickupCity: string;
  deliveryCity: string;
  weightKg?: number;
  isFragile?: boolean;
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
};

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async match(input: MatchQuoteInput): Promise<MatchQuoteResult[]> {
    const deliveryService = input.deliveryService ?? "STANDARD";
    const distanceKm = input.estimatedDistanceKm ?? 5;
    const weightKg = input.weightKg ?? 1;
    const isFragile = input.isFragile ?? false;

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
      },
    });

    const results: MatchQuoteResult[] = [];

    for (const op of operators) {
      if (
        !this.coversCity(op.coverageAreas, input.pickupCity) ||
        !this.coversCity(op.coverageAreas, input.deliveryCity)
      ) {
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
      });
    }

    return results.sort((a, b) => a.price - b.price);
  }

  async priceForOperator(
    operatorId: string,
    input: Omit<MatchQuoteInput, "operatorId">,
  ): Promise<number> {
    const matches = await this.match({ ...input, operatorId });
    if (matches.length) return matches[0].price;
    return this.fallbackPrice(
      input.estimatedDistanceKm ?? 5,
      input.isFragile ?? false,
    );
  }

  coversCity(
    areas: { name: string; level: string; config: Prisma.JsonValue }[],
    city: string,
  ): boolean {
    if (!city) return areas.length === 0;
    const needle = city.trim().toLowerCase();
    if (!areas.length) return true;

    return areas.some((area) => {
      if (area.level === "city") {
        const cfg = (area.config ?? {}) as Record<string, unknown>;
        const cfgCity =
          typeof cfg.city === "string" ? cfg.city.toLowerCase() : "";
        if (cfgCity && cfgCity === needle) return true;
        if (area.name.toLowerCase().includes(needle)) return true;
      }
      const cfg = (area.config ?? {}) as Record<string, unknown>;
      if (typeof cfg.city === "string" && cfg.city.toLowerCase() === needle) {
        return true;
      }
      return false;
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
