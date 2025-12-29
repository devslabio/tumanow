import { SetMetadata } from '@nestjs/common';

export const CACHE_INVALIDATE_KEY = 'cache_invalidate';

/**
 * Decorator to mark methods that should invalidate specific cache keys
 * Usage: @CacheInvalidate('user:roles:${userId}')
 */
export const CacheInvalidate = (...keys: string[]) => SetMetadata(CACHE_INVALIDATE_KEY, keys);

