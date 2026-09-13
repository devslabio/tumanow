import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  listActiveOperators() {
    return this.prisma.operator.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        code: true,
        legalName: true,
        tradingName: true,
        city: true,
      },
      orderBy: { tradingName: "asc" },
    });
  }
}
