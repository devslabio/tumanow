import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, getTestApp } from '../app.factory';
import {
  createTestUser,
  authenticateUser,
  cleanupTestData,
  createTestOperator,
} from '../test-helpers';

describe('Users Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let operatorUser: Awaited<ReturnType<typeof createTestUser>>;
  let adminToken: string;
  let operatorToken: string;

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

    // Create admin user
    adminUser = await createTestUser(prisma, {
      email: 'admin@example.com',
      phone: '+255111111111',
      password: 'Admin123!@#',
      roles: ['SUPER_ADMIN'],
    });
    const adminAuth = await authenticateUser(app, adminUser.email, 'Admin123!@#');
    adminToken = adminAuth.accessToken;

    // Create operator user
    const operator = await createTestOperator(prisma);
    operatorUser = await createTestUser(prisma, {
      email: 'operator@example.com',
      phone: '+255222222222',
      password: 'Operator123!@#',
      operatorId: operator.id,
      roles: ['OPERATOR_ADMIN'],
    });
    const operatorAuth = await authenticateUser(app, operatorUser.email, 'Operator123!@#');
    operatorToken = operatorAuth.accessToken;
  });

  describe('POST /api/users', () => {
    it('should create a new user as admin', async () => {
      const response = await getTestApp(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          phone: '+255333333333',
          password: 'NewUser123!@#',
          name: 'New User',
          status: 'ACTIVE',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('newuser@example.com');
      expect(response.body.phone).toBe('+255333333333');
    });

    it('should fail with duplicate email', async () => {
      await getTestApp(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: adminUser.email,
          phone: '+255444444444',
          password: 'Test123!@#',
          name: 'Duplicate Email',
        })
        .expect(409);
    });

    it('should fail with duplicate phone', async () => {
      await getTestApp(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'different@example.com',
          phone: adminUser.phone,
          password: 'Test123!@#',
          name: 'Duplicate Phone',
        })
        .expect(409);
    });

    it('should fail without authentication', async () => {
      await getTestApp(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          phone: '+255555555555',
          password: 'Test123!@#',
          name: 'Test User',
        })
        .expect(401);
    });
  });

  describe('GET /api/users', () => {
    it('should get all users as admin', async () => {
      const response = await getTestApp(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(2); // admin + operator
    });

    it('should filter users by status', async () => {
      const response = await getTestApp(app)
        .get('/api/users?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((user: any) => user.status === 'ACTIVE')).toBe(true);
    });

    it('should paginate users', async () => {
      const response = await getTestApp(app)
        .get('/api/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 1);
    });

    it('should search users by email', async () => {
      const response = await getTestApp(app)
        .get('/api/users?search=admin@example.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toContain('admin@example.com');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id as admin', async () => {
      const response = await getTestApp(app)
        .get(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(adminUser.id);
      expect(response.body.email).toBe(adminUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      await getTestApp(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await getTestApp(app)
        .get(`/api/users/${adminUser.id}`)
        .expect(401);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user as admin', async () => {
      const response = await getTestApp(app)
        .patch(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Admin Name',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Admin Name');
    });

    it('should update user status', async () => {
      const response = await getTestApp(app)
        .patch(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INACTIVE',
        })
        .expect(200);

      expect(response.body.status).toBe('INACTIVE');
    });

    it('should fail with invalid status', async () => {
      await getTestApp(app)
        .patch(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });
  });

  describe('POST /api/users/:id/roles', () => {
    it('should assign roles to user', async () => {
      const response = await getTestApp(app)
        .post(`/api/users/${adminUser.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleNames: ['OPERATOR_ADMIN', 'DRIVER'],
        })
        .expect(200);

      expect(response.body.user_roles.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail with non-existent role', async () => {
      await getTestApp(app)
        .post(`/api/users/${adminUser.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleNames: ['NON_EXISTENT_ROLE'],
        })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete user as admin', async () => {
      const newUser = await createTestUser(prisma, {
        email: 'todelete@example.com',
        phone: '+255666666666',
        password: 'Test123!@#',
      });

      await getTestApp(app)
        .delete(`/api/users/${newUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is soft deleted
      const response = await getTestApp(app)
        .get(`/api/users/${newUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should fail to delete non-existent user', async () => {
      await getTestApp(app)
        .delete('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

