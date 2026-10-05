import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../prisma/prisma.service";
import type { TumaNowJwtPayload } from "./jwt-payload";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: TumaNowJwtPayload;
    }>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice(7);
    let payload: TumaNowJwtPayload;
    try {
      payload = this.jwt.verify<TumaNowJwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { isActive: true, tokenVersion: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account is no longer active");
    }
    if ((payload.tokenVersion ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException("Session expired, please log in again");
    }

    req.user = payload;
    return true;
  }
}
