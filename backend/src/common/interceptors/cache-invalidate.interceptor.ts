import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_INVALIDATE_KEY } from '../decorators/cache-invalidate.decorator';

@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const keysToInvalidate = this.reflector.get<string[]>(
      CACHE_INVALIDATE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(async () => {
        if (keysToInvalidate && keysToInvalidate.length > 0) {
          // Get request parameters to replace placeholders in cache keys
          const request = context.switchToHttp().getRequest();
          const params = { ...request.params, ...request.query, userId: request.user?.id };

          // Replace placeholders in cache keys
          const resolvedKeys = keysToInvalidate.map((key) => {
            return key.replace(/\$\{(\w+)\}/g, (match, param) => {
              return params[param] || match;
            });
          });

          // Invalidate cache keys
          await Promise.all(
            resolvedKeys.map((key) => this.cacheManager.del(key)),
          );
        }
      }),
    );
  }
}

