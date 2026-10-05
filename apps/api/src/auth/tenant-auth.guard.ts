import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { ApiKeyAuthGuard } from "./api-key-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";

/**
 * Accepts either a human session (Bearer JWT) or an operator API key
 * (X-Api-Key). Lets operator-facing tenant/* endpoints double as the
 * integration surface described in the product doc's "API-first" principle,
 * without a second copy of every controller.
 */
@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyAuthGuard,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    if (req.headers["x-api-key"]) {
      return this.apiKeyGuard.canActivate(context);
    }
    return this.jwtGuard.canActivate(context);
  }
}
