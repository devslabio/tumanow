import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, getTestApp } from '../app.factory';
import { createTestUser, authenticateUser, cleanupTestData } from '../test-helpers';

describe('Auth Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await cleanupTestData(prisma);
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestData(prisma);
    testUser = await createTestUser(prisma, {
      email: 'test@example.com',
      phone: '+255123456789',
      password: 'Test123!@#',
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with email successfully', async () => {
      const response = await getTestApp(app)
        .post('/api/auth/login')
        .send({
          phoneOrEmail: testUser.email,
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should login with phone successfully', async () => {
      const response = await getTestApp(app)
        .post('/api/auth/login')
        .send({
          phoneOrEmail: testUser.phone,
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should fail with invalid credentials', async () => {
      await getTestApp(app)
        .post('/api/auth/login')
        .send({
          phoneOrEmail: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail with non-existent user', async () => {
      await getTestApp(app)
        .post('/api/auth/login')
        .send({
          phoneOrEmail: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);
    });

    it('should fail with missing credentials', async () => {
      await getTestApp(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await getTestApp(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          phone: '+255987654321',
          password: 'NewUser123!@#',
          name: 'New User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should fail with duplicate email', async () => {
      await getTestApp(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          phone: '+255111222333',
          password: 'Test123!@#',
          name: 'Duplicate User',
        })
        .expect(409);
    });

    it('should fail with duplicate phone', async () => {
      await getTestApp(app)
        .post('/api/auth/register')
        .send({
          email: 'different@example.com',
          phone: testUser.phone,
          password: 'Test123!@#',
          name: 'Duplicate Phone',
        })
        .expect(409);
    });

    it('should fail with invalid email format', async () => {
      await getTestApp(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          phone: '+255123456789',
          password: 'Test123!@#',
          name: 'Invalid Email',
        })
        .expect(400);
    });

    it('should fail with weak password', async () => {
      await getTestApp(app)
        .post('/api/auth/register')
        .send({
          email: 'weakpass@example.com',
          phone: '+255123456789',
          password: '123',
          name: 'Weak Password',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const { refreshToken } = await authenticateUser(app, testUser.email, 'Test123!@#');

      const response = await getTestApp(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      await getTestApp(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const { accessToken } = await authenticateUser(app, testUser.email, 'Test123!@#');

      const response = await getTestApp(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('phone', testUser.phone);
    });

    it('should fail without token', async () => {
      await getTestApp(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await getTestApp(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PATCH /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const { accessToken } = await authenticateUser(app, testUser.email, 'Test123!@#');

      const response = await getTestApp(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('updated@example.com');
    });

    it('should fail with invalid email format', async () => {
      const { accessToken } = await authenticateUser(app, testUser.email, 'Test123!@#');

      await getTestApp(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const { accessToken } = await authenticateUser(app, testUser.email, 'Test123!@#');

      await getTestApp(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewPassword123!@#',
        })
        .expect(200);

      // Verify new password works
      await authenticateUser(app, testUser.email, 'NewPassword123!@#');
    });

    it('should fail with incorrect current password', async () => {
      const { accessToken } = await authenticateUser(app, testUser.email, 'Test123!@#');

      await getTestApp(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!@#',
        })
        .expect(400);
    });
  });
});

