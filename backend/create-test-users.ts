import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = 'Pass123';
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('Creating test users...');

  // First, ensure roles exist
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Platform super administrator' },
    { code: 'PLATFORM_SUPPORT', name: 'Platform Support', description: 'Platform support staff' },
    { code: 'OPERATOR_ADMIN', name: 'Operator Admin', description: 'Operator administrator' },
    { code: 'DISPATCHER', name: 'Dispatcher', description: 'Order dispatcher' },
    { code: 'DRIVER', name: 'Driver', description: 'Delivery driver' },
    { code: 'CUSTOMER', name: 'Customer', description: 'End customer' },
  ];

  // Create roles if they don't exist
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { code: roleData.code },
      update: {},
      create: roleData,
    });
  }

  // Test users with different roles
  const testUsers = [
    {
      name: 'Super Admin',
      phone: '+250788000001',
      email: 'superadmin@tumanow.rw',
      password_hash: passwordHash,
      roles: ['SUPER_ADMIN'],
    },
    {
      name: 'Platform Support',
      phone: '+250788000002',
      email: 'support@tumanow.rw',
      password_hash: passwordHash,
      roles: ['PLATFORM_SUPPORT'],
    },
    {
      name: 'Operator Admin',
      phone: '+250788000003',
      email: 'operator@tumanow.rw',
      password_hash: passwordHash,
      roles: ['OPERATOR_ADMIN'],
    },
    {
      name: 'Dispatcher',
      phone: '+250788000004',
      email: 'dispatcher@tumanow.rw',
      password_hash: passwordHash,
      roles: ['DISPATCHER'],
    },
    {
      name: 'Driver',
      phone: '+250788000005',
      email: 'driver@tumanow.rw',
      password_hash: passwordHash,
      roles: ['DRIVER'],
    },
    {
      name: 'Customer',
      phone: '+250788000006',
      email: 'customer@tumanow.rw',
      password_hash: passwordHash,
      roles: ['CUSTOMER'],
      isCustomer: true,
      customerType: 'INDIVIDUAL',
    },
  ];

  for (const userData of testUsers) {
    const { roles: userRoles, isCustomer, customerType, ...userFields } = userData;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: userFields.phone },
          { email: userFields.email },
        ],
      },
    });

    if (existingUser) {
      console.log(`User ${userFields.email} already exists, updating...`);
      
      // Update user
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ...userFields,
          is_customer: isCustomer || false,
          customer_type: customerType || null,
        },
      });

      // Update roles
      await prisma.userRole.deleteMany({
        where: { user_id: existingUser.id },
      });

      for (const roleCode of userRoles) {
        const role = await prisma.role.findUnique({
          where: { code: roleCode },
        });

        if (role) {
          await prisma.userRole.create({
            data: {
              user_id: existingUser.id,
              role_id: role.id,
            },
          });
        }
      }

      console.log(`✅ Updated: ${userFields.email} (${userRoles.join(', ')})`);
    } else {
      // Create new user
      const user = await prisma.user.create({
        data: {
          ...userFields,
          status: 'ACTIVE',
          is_customer: isCustomer || false,
          customer_type: customerType || null,
        },
      });

      // Assign roles
      for (const roleCode of userRoles) {
        const role = await prisma.role.findUnique({
          where: { code: roleCode },
        });

        if (role) {
          await prisma.userRole.create({
            data: {
              user_id: user.id,
              role_id: role.id,
            },
          });
        }
      }

      console.log(`✅ Created: ${userFields.email} (${userRoles.join(', ')})`);
    }
  }

  console.log('\n==========================================');
  console.log('Test Users Created Successfully!');
  console.log('==========================================');
  console.log('All users have password: Pass123');
  console.log('\nCredentials:');
  testUsers.forEach((user) => {
    console.log(`\n${user.name}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Phone: ${user.phone}`);
    console.log(`  Roles: ${user.roles.join(', ')}`);
  });
  console.log('\n==========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

