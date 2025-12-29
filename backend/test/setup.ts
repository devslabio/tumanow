// Test setup file
// This file runs before all tests

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRATION = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tumanow_test?schema=public';
process.env.NODE_ENV = 'test';

