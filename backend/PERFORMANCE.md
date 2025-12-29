# Performance Optimization Guide

This document outlines the performance optimizations implemented in the TumaNow backend.

## Caching Strategy

### In-Memory Cache
The application uses NestJS Cache Manager with in-memory caching by default. For production deployments, consider using Redis for distributed caching.

### Cached Endpoints

#### Dashboard Stats (`/api/dashboard`)
- **Cache Duration**: 5 minutes (300 seconds)
- **Cache Key**: `dashboard:{userId}:{userRole}:{operatorId}:{startDate}:{endDate}`
- **Rationale**: Dashboard stats are frequently accessed but don't change frequently. 5 minutes provides a good balance between freshness and performance.

#### Reports (`/api/reports`)
- **Cache Duration**: 10 minutes (600 seconds)
- **Cache Key**: `report:{type}:{operatorId}:{startDate}:{endDate}:{orderStatus}`
- **Rationale**: Reports involve expensive database queries and aggregations. 10 minutes reduces database load significantly.

#### Settings (`/api/settings`)
- **Cache Duration**: 1 hour (3600 seconds)
- **Cache Keys**:
  - `setting:{key}` - Individual setting
  - `setting:value:{key}` - Setting value only
  - `settings:category:{category}` - Settings by category
- **Rationale**: Settings rarely change, so longer cache duration is appropriate.

#### User Roles (`getUserWithRoles`)
- **Cache Duration**: 15 minutes (900 seconds)
- **Cache Key**: `user:roles:{userId}`
- **Rationale**: User roles are checked frequently but don't change often.

### Cache Invalidation

Cache is automatically invalidated when:
- Settings are created, updated, or deleted
- User roles are updated (via cache invalidation interceptor)

## Database Optimization

### Indexes
The database schema includes comprehensive indexes on:
- Foreign keys (operator_id, customer_id, user_id, etc.)
- Frequently queried fields (status, created_at, order_number, etc.)
- Unique constraints (email, phone, code fields)

### Query Optimization

1. **Selective Field Loading**: Use `select` to fetch only required fields
2. **Pagination**: All list endpoints support pagination to limit result sets
3. **Batch Operations**: Use `Promise.all()` for parallel queries where possible
4. **Raw SQL for Aggregations**: Complex aggregations use optimized raw SQL queries

### Best Practices

1. **Avoid N+1 Queries**: Use Prisma `include` or `select` to fetch related data in a single query
2. **Limit Result Sets**: Use `take` to limit the number of records returned
3. **Use Indexes**: Ensure queries use indexed fields in WHERE clauses
4. **Connection Pooling**: Prisma handles connection pooling automatically

## Performance Monitoring

### Metrics to Monitor

1. **Response Times**: Track API response times, especially for:
   - Dashboard endpoints
   - Report generation
   - Complex queries

2. **Database Query Performance**: Monitor slow queries using PostgreSQL's `pg_stat_statements`

3. **Cache Hit Rates**: Monitor cache effectiveness (if using Redis)

### Recommended Tools

- **Application Performance Monitoring (APM)**: Consider integrating tools like:
  - New Relic
  - Datadog
  - Sentry (for error tracking)

- **Database Monitoring**: Use PostgreSQL monitoring tools:
  - `pg_stat_statements` extension
  - `EXPLAIN ANALYZE` for query optimization

## Future Optimizations

### Redis Integration
For production deployments, consider integrating Redis for:
- Distributed caching across multiple instances
- Session storage
- Rate limiting
- Real-time features

### Database Read Replicas
For high-traffic scenarios, consider:
- Setting up read replicas for reporting queries
- Using read replicas for dashboard queries

### Query Result Pagination
Ensure all list endpoints properly implement pagination to avoid loading large datasets.

### Background Jobs
Consider moving heavy operations to background jobs:
- Report generation
- Bulk data processing
- Email/SMS sending

## Configuration

### Environment Variables

```bash
# Cache configuration (optional - defaults to in-memory)
REDIS_URL=redis://localhost:6379

# Database connection pooling (handled by Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/tumanow
```

### Cache Configuration

The cache module is configured in `src/cache/cache.module.ts`. Default settings:
- **TTL**: 1 hour (3600 seconds)
- **Max Items**: 1000

Adjust these values based on your application's memory constraints and caching needs.

