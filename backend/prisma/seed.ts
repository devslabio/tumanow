import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default roles
  const superAdminRole = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: {},
    create: {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Platform owner with full access',
    },
  });

  const platformSupportRole = await prisma.role.upsert({
    where: { code: 'PLATFORM_SUPPORT' },
    update: {},
    create: {
      code: 'PLATFORM_SUPPORT',
      name: 'Platform Support',
      description: 'Platform support staff',
    },
  });

  const operatorAdminRole = await prisma.role.upsert({
    where: { code: 'OPERATOR_ADMIN' },
    update: {},
    create: {
      code: 'OPERATOR_ADMIN',
      name: 'Operator Admin',
      description: 'Operator administrator',
    },
  });

  const dispatcherRole = await prisma.role.upsert({
    where: { code: 'DISPATCHER' },
    update: {},
    create: {
      code: 'DISPATCHER',
      name: 'Dispatcher',
      description: 'Operations/dispatcher staff',
    },
  });

  const customerCareRole = await prisma.role.upsert({
    where: { code: 'CUSTOMER_CARE' },
    update: {},
    create: {
      code: 'CUSTOMER_CARE',
      name: 'Customer Care',
      description: 'Customer support staff',
    },
  });

  const driverRole = await prisma.role.upsert({
    where: { code: 'DRIVER' },
    update: {},
    create: {
      code: 'DRIVER',
      name: 'Driver',
      description: 'Delivery driver',
    },
  });

  console.log('✅ Roles created');

  // Create super admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@tumanow.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@tumanow.com',
      phone: '+250788000000',
      password_hash: hashedPassword,
      status: 'ACTIVE',
      is_customer: false,
      user_roles: {
        create: {
          role_id: superAdminRole.id,
        },
      },
    },
  });

  console.log('✅ Super admin user created (admin@tumanow.com / admin123)');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

