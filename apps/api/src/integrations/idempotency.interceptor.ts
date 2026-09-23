import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createHash } from "node:crypto";
import { Observable, from, of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";

import { PrismaService } from "../prisma/prisma.service";

export const IDEMPOTENCY_SCOPE_KEY = "idempotency:scope";

/** Marks a mutating endpoint as safe to replay via an `Idempotency-Key` header. */
export const IdempotencyScope = (scope: string) =>
  SetMetadata(IDEMPOTENCY_SCOPE_KEY, scope);

function hashBody(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");
}

/**
 * Doc §52: "External API requests must support idempotency." A client
 * retrying a request (timeout, dropped connection) with the same
 * `Idempotency-Key` gets back the original response instead of creating a
 * second shipment. Reusing the key with a *different* request body is
 * treated as a client bug (409), not a legitimate retry.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const scope = this.reflector.getAllAndOverride<string>(IDEMPOTENCY_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!scope) return next.handle();

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      body: unknown;
      user?: { sub?: string };
    }>();
    const header = req.headers["idempotency-key"];
    const key = Array.isArray(header) ? header[0] : header;
    if (!key) return next.handle();

    // A client-chosen key is only unique per caller — namespace it by actor
    // so two different customers picking the same key string can't collide.
    const actorId = req.user?.sub ?? "anonymous";
    const scopedKey = `${scope}:${actorId}`;
    const requestHash = hashBody(req.body);

    return from(
      this.prisma.idempotencyKey.findUnique({
        where: { scope_key: { scope: scopedKey, key } },
      }),
    ).pipe(
      switchMap((existing) => {
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new ConflictException(
              "Idempotency-Key was already used with a different request body",
            );
          }
          return of(existing.responseBody);
        }

        return next.handle().pipe(
          tap((response) => {
            void this.prisma.idempotencyKey
              .create({
                data: {
                  scope: scopedKey,
                  key,
                  requestHash,
                  statusCode: 200,
                  responseBody: (response ?? {}) as object,
                },
              })
              // Racing concurrent identical requests is fine — first write wins.
              .catch(() => undefined);
          }),
        );
      }),
    );
  }
}
