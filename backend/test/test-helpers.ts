import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { getTestApp } from './app.factory';

export interface TestUser {
  id: string;
  email: string;
  phone: string;
  password: string;
  operatorId?: string;
  roles?: string[];
  token?: string;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
  prisma: PrismaService,
  data: {
    email?: string;
    phone?: string;
    password?: string;
    operatorId?: string;
    roles?: string[];
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  } = {},
): Promise<TestUser> {
  const email = data.email || `test-${Date.now()}@example.com`;
  const phone = data.phone || `+255${Math.floor(Math.random() * 1000000000)}`;
  const password = data.password || 'Test123!@#';
  const passwordHash = await bcrypt.hash(password, 10);

  // Get or create operator if operatorId is provided
  let operatorId = data.operatorId;
  if (operatorId) {
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
    });
    if (!operator) {
      throw new Error(`Operator with id ${operatorId} not found`);
    }
  } else {
    // Create a test operator
    const operator = await prisma.operator.create({
      data: {
        name: `Test Operator ${Date.now()}`,
        code: `OP-${Date.now()}`,
        email: `operator-${Date.now()}@example.com`,
        phone: `+255${Math.floor(Math.random() * 1000000000)}`,
        status: 'ACTIVE',
      },
    });
    operatorId = operator.id;
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      name: `Test User ${Date.now()}`,
      email,
      phone,
      password_hash: passwordHash,
      operator_id: operatorId,
      status: data.status || 'ACTIVE',
      user_roles: {
        create: (data.roles || ['OPERATOR_ADMIN']).map((roleName) => ({
          role: {
            connectOrCreate: {
              where: { code: roleName },
              create: {
                code: roleName,
                name: roleName,
                description: `Test ${roleName} role`,
              },
            },
          },
        })),
      },
    },
    include: {
      user_roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return {
    id: user.id,
    email: user.email!,
    phone: user.phone,
    password,
    operatorId: user.operator_id || undefined,
    roles: (user as any).user_roles?.map((ur: any) => ur.role.name) || [],
  };
}

/**
 * Authenticate a user and get JWT token
 */
export async function authenticateUser(
  app: INestApplication,
  phoneOrEmail: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await getTestApp(app)
    .post('/api/auth/login')
    .send({
      phoneOrEmail,
      password,
    })
    .expect(200);

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  };
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(prisma: PrismaService): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.trackingEvent.deleteMany({});
  await prisma.orderAssignment.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.vehicleDriver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.operator.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
}

/**
 * Create a test operator
 */
export async function createTestOperator(
  prisma: PrismaService,
  data: {
    name?: string;
    code?: string;
    contactEmail?: string;
    contactPhone?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  } = {},
) {
  const name = data.name || `Test Operator ${Date.now()}`;
  const code = data.code || `OP-${Date.now()}`;
  const contactEmail = data.contactEmail || `operator-${Date.now()}@example.com`;
  const contactPhone = data.contactPhone || `+255${Math.floor(Math.random() * 1000000000)}`;

  return await prisma.operator.create({
      data: {
        name,
        code,
        email: contactEmail,
        phone: contactPhone,
        status: data.status || 'ACTIVE',
      },
  });
}

/**
 * Create a test driver
 */
export async function createTestDriver(
  prisma: PrismaService,
  operatorId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    licenseNumber?: string;
    status?: 'AVAILABLE' | 'ASSIGNED' | 'BUSY' | 'OFFLINE';
  } = {},
) {
  const name = data.name || `Test Driver ${Date.now()}`;
  const phone = data.phone || `+255${Math.floor(Math.random() * 1000000000)}`;
  const email = data.email || `driver-${Date.now()}@example.com`;
  const licenseNumber = data.licenseNumber || `DL-${Date.now()}`;

  return await prisma.driver.create({
    data: {
      operator_id: operatorId,
      name,
      phone,
      email,
      license_number: licenseNumber,
      status: data.status || 'AVAILABLE',
    },
  });
}

/**
 * Create a test vehicle
 */
export async function createTestVehicle(
  prisma: PrismaService,
  operatorId: string,
  data: {
    plateNumber?: string;
    make?: string;
    model?: string;
    vehicleType?: string;
    status?: 'AVAILABLE' | 'ASSIGNED' | 'IN_TRANSIT' | 'MAINTENANCE';
  } = {},
) {
  const plateNumber = data.plateNumber || `T-${Date.now()}`;
  const make = data.make || 'Toyota';
  const model = data.model || 'Hiace';
  const vehicleType = data.vehicleType || 'VAN';
  const code = `VEH-${String(Date.now()).slice(-6)}`;

  return await prisma.vehicle.create({
    data: {
      operator_id: operatorId,
      code,
      plate_number: plateNumber,
      make,
      model,
      vehicle_type: vehicleType,
      status: data.status || 'AVAILABLE',
      capacity_kg: 1000,
    },
  });
}

/**
 * Helper function to create order payload for API requests
 */
export function createOrderPayload(data: {
  operatorId: string;
  customerId: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  [key: string]: any;
}) {
  return {
    operator_id: data.operatorId,
    customer_id: data.customerId,
    pickup_address: data.pickupAddress || '123 Main St',
    pickup_lat: data.pickup_lat ?? -6.7924,
    pickup_lng: data.pickup_lng ?? 39.2083,
    pickup_contact_name: data.pickup_contact_name || 'John Doe',
    pickup_contact_phone: data.pickup_contact_phone || '+255123456789',
    delivery_address: data.deliveryAddress || '456 Oak Ave',
    delivery_lat: data.delivery_lat ?? -6.8000,
    delivery_lng: data.delivery_lng ?? 39.2200,
    delivery_contact_name: data.delivery_contact_name || 'Jane Smith',
    delivery_contact_phone: data.delivery_contact_phone || '+255987654321',
    item_type: data.item_type || 'SMALL_PARCEL',
    weight_kg: data.weight_kg ?? 5,
    delivery_mode: data.delivery_mode || 'SAME_DAY',
    base_price: data.base_price ?? 10000,
    total_price: data.total_price ?? 10000,
    ...data,
  };
}

