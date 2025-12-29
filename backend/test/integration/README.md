# Integration Tests

This directory contains end-to-end integration tests for the TumaNow API using Supertest.

## Setup

1. Ensure you have a test database configured. Set the `TEST_DATABASE_URL` environment variable:
   ```bash
   export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tumanow_test?schema=public"
   ```

2. Run Prisma migrations on the test database:
   ```bash
   DATABASE_URL=$TEST_DATABASE_URL pnpm prisma migrate deploy
   ```

## Running Tests

### Run all integration tests
```bash
pnpm test:integration
```

### Run integration tests in watch mode
```bash
pnpm test:integration:watch
```

### Run integration tests with coverage
```bash
pnpm test:integration:cov
```

### Run all tests (unit + integration)
```bash
pnpm test:all
```

## Test Structure

- `auth.integration.spec.ts` - Authentication endpoints (login, register, refresh, profile)
- `users.integration.spec.ts` - User management endpoints (CRUD, roles)
- `orders.integration.spec.ts` - Order management endpoints (create, track, status updates)

## Test Helpers

The `test-helpers.ts` file provides utility functions:
- `createTestUser()` - Create a test user with roles
- `createTestOperator()` - Create a test operator
- `createTestDriver()` - Create a test driver
- `createTestVehicle()` - Create a test vehicle
- `authenticateUser()` - Get JWT tokens for a user
- `cleanupTestData()` - Clean up test data from database
- `createOrderPayload()` - Helper to create order payloads

## Notes

- Tests use a separate test database to avoid affecting development data
- Each test suite cleans up data before and after running
- Tests use real database operations (not mocks) to ensure end-to-end coverage
- Test timeout is set to 30 seconds for integration tests

