import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Fields that must never leave the API, no matter which service returned
 * them. Several services return raw Prisma rows (`include` rather than a
 * narrow `select`), so a field like `podOtp` can otherwise ride along on
 * any shipment read — not just the endpoint that generates it — once it's
 * been set. This is a defense-in-depth backstop, not a substitute for
 * selecting only the fields a response needs.
 */
const SENSITIVE_KEYS = new Set([
  "podOtp",
  "passwordHash",
  "phoneOtp",
  "emailVerifyToken",
  "passwordResetToken",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function redact(value: unknown, seen: WeakSet<object>): unknown {
  if (Array.isArray(value)) return value.map((v) => redact(v, seen));
  if (isPlainObject(value)) {
    if (seen.has(value)) return value;
    seen.add(value);
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      out[key] = redact(val, seen);
    }
    return out;
  }
  // Dates, Prisma Decimal instances, and other class instances are left
  // untouched so their own toJSON() (e.g. Decimal -> numeric string) still
  // runs during response serialization.
  return value;
}

@Injectable()
export class RedactSensitiveInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => redact(data, new WeakSet())));
  }
}
