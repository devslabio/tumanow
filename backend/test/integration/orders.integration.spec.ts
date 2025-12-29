import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, getTestApp } from '../app.factory';
import {
  createTestUser,
  authenticateUser,
  cleanupTestData,
  createTestOperator,
  createTestDriver,
  createTestVehicle,
  createOrderPayload,
} from '../test-helpers';

describe('Orders Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let operatorUser: Awaited<ReturnType<typeof createTestUser>>;
  let adminToken: string;
  let operatorToken: string;
  let testOperator: Awaited<ReturnType<typeof createTestOperator>>;
  let testDriver: Awaited<ReturnType<typeof createTestDriver>>;
  let testVehicle: Awaited<ReturnType<typeof createTestVehicle>>;

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

    // Create test operator
    testOperator = await createTestOperator(prisma);

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
    operatorUser = await createTestUser(prisma, {
      email: 'operator@example.com',
      phone: '+255222222222',
      password: 'Operator123!@#',
      operatorId: testOperator.id,
      roles: ['OPERATOR_ADMIN'],
    });
    const operatorAuth = await authenticateUser(app, operatorUser.email, 'Operator123!@#');
    operatorToken = operatorAuth.accessToken;

    // Create test driver and vehicle
    testDriver = await createTestDriver(prisma, testOperator.id);
    testVehicle = await createTestVehicle(prisma, testOperator.id);
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      // Create a customer user first
      const customer = await createTestUser(prisma, {
        email: 'customer@example.com',
        phone: '+255333333333',
        password: 'Customer123!@#',
        operatorId: testOperator.id,
        roles: [],
      });

      const response = await getTestApp(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          operator_id: testOperator.id,
          customer_id: customer.id,
          pickup_address: '123 Main St',
          pickup_lat: -6.7924,
          pickup_lng: 39.2083,
          pickup_contact_name: 'John Doe',
          pickup_contact_phone: '+255123456789',
          delivery_address: '456 Oak Ave',
          delivery_lat: -6.8000,
          delivery_lng: 39.2200,
          delivery_contact_name: 'Jane Smith',
          delivery_contact_phone: '+255987654321',
          item_type: 'SMALL_PARCEL',
          weight_kg: 5,
          delivery_mode: 'SAME_DAY',
          base_price: 10000,
          total_price: 10000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.order_number).toBeDefined();
      expect(response.body.pickup_contact_name).toBe('John Doe');
      expect(response.body.delivery_contact_name).toBe('Jane Smith');
    });

    it('should fail with missing required fields', async () => {
      await getTestApp(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          operator_id: testOperator.id,
          pickup_address: '123 Main St',
          // Missing other required fields
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await getTestApp(app)
        .post('/api/orders')
        .send({
          operator_id: testOperator.id,
        })
        .expect(401);
    });
  });

  describe('GET /api/orders', () => {
    it('should get all orders', async () => {
      // Create a customer user first
      const customer = await createTestUser(prisma, {
        email: 'customer2@example.com',
        phone: '+255444444444',
        password: 'Customer123!@#',
        operatorId: testOperator.id,
        roles: [],
      });

      // Create a test order first
      await getTestApp(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(createOrderPayload({
          operatorId: testOperator.id,
          customerId: customer.id,
        }));

      const response = await getTestApp(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await getTestApp(app)
        .get('/api/orders?status=PENDING')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.data.every((order: any) => order.status === 'PENDING')).toBe(true);
    });

    it('should paginate orders', async () => {
      const response = await getTestApp(app)
        .get('/api/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order by id', async () => {
      // Create a customer user first
      const customer = await createTestUser(prisma, {
        email: 'customer3@example.com',
        phone: '+255555555555',
        password: 'Customer123!@#',
        operatorId: testOperator.id,
        roles: [],
      });

      // Create a test order
      const createResponse = await getTestApp(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(createOrderPayload({
          operatorId: testOperator.id,
          customerId: customer.id,
        }));

      const orderId = createResponse.body.id;

      const response = await getTestApp(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.order_number).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      await getTestApp(app)
        .get('/api/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      // Create a customer user first
      const customer = await createTestUser(prisma, {
        email: 'customer4@example.com',
        phone: '+255666666666',
        password: 'Customer123!@#',
        operatorId: testOperator.id,
        roles: [],
      });

      // Create a test order
      const createResponse = await getTestApp(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(createOrderPayload({
          operatorId: testOperator.id,
          customerId: customer.id,
        }));

      const orderId = createResponse.body.id;

      const response = await getTestApp(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          status: 'CONFIRMED',
        })
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });

    it('should fail with invalid status', async () => {
      // Create a customer user first
      const customer = await createTestUser(prisma, {
        email: 'customer5@example.com',
        phone: '+255777777777',
        password: 'Customer123!@#',
        operatorId: testOperator.id,
        roles: [],
      });

      const createResponse = await getTestApp(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(createOrderPayload({
          operatorId: testOperator.id,
          customerId: customer.id,
        }));

      const orderId = createResponse.body.id;

      await getTestApp(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });
  });

  describe('GET /api/orders/track/:orderNumber', () => {
    it('should track order by order number', async () => {
      // Create a customer user first
      const customer = await createTestUser(prisma, {
        email: 'customer6@example.com',
        phone: '+255888888888',
        password: 'Customer123!@#',
        operatorId: testOperator.id,
        roles: [],
      });

      // Create a test order
      const createResponse = await getTestApp(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(createOrderPayload({
          operatorId: testOperator.id,
          customerId: customer.id,
        }));

      const orderNumber = createResponse.body.order_number;

      const response = await getTestApp(app)
        .get(`/api/orders/track/${orderNumber}`)
        .expect(200);

      expect(response.body.order_number).toBe(orderNumber);
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent order number', async () => {
      await getTestApp(app)
        .get('/api/orders/track/NONEXISTENT')
        .expect(404);
    });
  });
});

