import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Use in-memory cache by default
        // For production, configure Redis via REDIS_URL environment variable
        // and use cache-manager-redis-store or similar
        return {
          ttl: 3600 * 1000, // 1 hour in milliseconds
          max: 1000, // Maximum number of items in cache
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

