import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Rwandan names
const rwandanFirstNames = [
  'Jean', 'Marie', 'Paul', 'Claire', 'François', 'Aline', 'Joseph', 'Ange',
  'Pierre', 'Grace', 'Emmanuel', 'Chantal', 'David', 'Jeanne', 'Alexandre',
  'Mukamana', 'Ivan', 'Mukamurenzi', 'Eric', 'Mukamana', 'Patrick', 'Uwimana',
  'Olivier', 'Mukamana', 'Daniel', 'Mukamana', 'André', 'Mukamana', 'Thierry',
  'Mukamana', 'Fabrice', 'Mukamana', 'Gérard', 'Mukamana', 'Régis', 'Mukamana',
  'Innocent', 'Mukamana', 'Pacifique', 'Mukamana', 'Fidèle', 'Mukamana',
  'Benoît', 'Mukamana', 'Vincent', 'Mukamana', 'Sylvain', 'Mukamana',
  'Yves', 'Mukamana', 'Roger', 'Mukamana', 'Bernard', 'Mukamana',
];

const rwandanLastNames = [
  'Mukamana', 'Nkurunziza', 'Niyonshuti', 'Mukamurenzi', 'Nkurunziza',
  'Niyonshuti', 'Mukamana', 'Nkurunziza', 'Niyonshuti', 'Mukamurenzi',
  'Nkurunziza', 'Niyonshuti', 'Mukamana', 'Nkurunziza', 'Niyonshuti',
  'Mukamurenzi', 'Nkurunziza', 'Niyonshuti', 'Mukamana', 'Nkurunziza',
  'Niyonshuti', 'Mukamurenzi', 'Nkurunziza', 'Niyonshuti', 'Mukamana',
];

const operatorNames = [
  'Kigali Express Delivery',
  'Rwanda Logistics Pro',
  'Swift Courier Services',
  'Fast Track Delivery',
  'Reliable Transport Co',
];

const locations = [
  'Kigali, Nyarugenge',
  'Kigali, Gasabo',
  'Kigali, Kicukiro',
  'Huye, Southern Province',
  'Musanze, Northern Province',
  'Rubavu, Western Province',
  'Nyagatare, Eastern Province',
];

const vehicleTypes = ['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'];
const vehicleMakes = ['Toyota', 'Honda', 'Suzuki', 'Isuzu', 'Nissan'];
const vehicleModels = ['Corolla', 'Civic', 'Alto', 'D-Max', 'Navara'];

const orderStatuses = [
  'CREATED',
  'PENDING_OPERATOR_ACTION',
  'APPROVED',
  'AWAITING_PAYMENT',
  'PAID',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

function getRandomPhone(): string {
  const prefixes = ['788', '789', '730', '731', '732'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `+250${prefix}${number}`;
}

async function main() {
  console.log('🌱 Populating database with sample data...');

  const passwordHash = await bcrypt.hash('Pass123', 10);

  // Get roles
  const roles = await prisma.role.findMany();
  const customerRole = roles.find(r => r.code === 'CUSTOMER');
  const driverRole = roles.find(r => r.code === 'DRIVER');
  const operatorAdminRole = roles.find(r => r.code === 'OPERATOR_ADMIN');
  const dispatcherRole = roles.find(r => r.code === 'DISPATCHER');

  if (!customerRole || !driverRole || !operatorAdminRole || !dispatcherRole) {
    console.error('❌ Required roles not found. Please run seed first.');
    process.exit(1);
  }

  // Create 3 operators
  console.log('📦 Creating operators...');
  const operators = [];
  for (let i = 0; i < 3; i++) {
    const code = `OP${String(i + 1).padStart(3, '0')}`;
    const operator = await prisma.operator.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: operatorNames[i] || `Operator ${i + 1}`,
        email: `operator${i + 1}@tumanow.rw`,
        phone: getRandomPhone(),
        status: 'ACTIVE',
        operator_config: {
          create: {
            supports_documents: true,
            supports_small_parcel: true,
            supports_electronics: true,
            supports_fragile: true,
            max_weight_kg: 50,
          },
        },
      },
    });
    operators.push(operator);
    console.log(`  ✅ Created/Updated operator: ${operator.name}`);
  }

  // Create operator admin users
  console.log('👤 Creating operator admin users...');
  for (let i = 0; i < operators.length; i++) {
    const firstName = getRandomElement(rwandanFirstNames);
    const lastName = getRandomElement(rwandanLastNames);
    const name = `${firstName} ${lastName}`;
    const phone = getRandomPhone();
    const email = `admin${i + 1}@${operators[i].code.toLowerCase()}.rw`;

    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        phone,
        password_hash: passwordHash,
        status: 'ACTIVE',
        operator_id: operators[i].id,
      },
      create: {
        name,
        phone,
        email,
        password_hash: passwordHash,
        status: 'ACTIVE',
        operator_id: operators[i].id,
        user_roles: {
          create: {
            role_id: operatorAdminRole.id,
          },
        },
      },
    });
    console.log(`  ✅ Created/Updated operator admin: ${name}`);
  }

  // Create dispatcher users
  console.log('👤 Creating dispatcher users...');
  for (let i = 0; i < operators.length; i++) {
    const firstName = getRandomElement(rwandanFirstNames);
    const lastName = getRandomElement(rwandanLastNames);
    const name = `${firstName} ${lastName}`;
    const phone = getRandomPhone();
    const email = `dispatcher${i + 1}@${operators[i].code.toLowerCase()}.rw`;

    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        phone,
        password_hash: passwordHash,
        status: 'ACTIVE',
        operator_id: operators[i].id,
      },
      create: {
        name,
        phone,
        email,
        password_hash: passwordHash,
        status: 'ACTIVE',
        operator_id: operators[i].id,
        user_roles: {
          create: {
            role_id: dispatcherRole.id,
          },
        },
      },
    });
    console.log(`  ✅ Created/Updated dispatcher: ${name}`);
  }

  // Create vehicles (5-8 per operator)
  console.log('🚗 Creating vehicles...');
  const vehicles = [];
  for (const operator of operators) {
    const vehicleCount = Math.floor(Math.random() * 4) + 5; // 5-8 vehicles
    for (let i = 0; i < vehicleCount; i++) {
      const vehicleType = getRandomElement(vehicleTypes);
      const make = getRandomElement(vehicleMakes);
      const model = getRandomElement(vehicleModels);
      const plateNumber = `R${Math.floor(Math.random() * 9)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(100 + Math.random() * 900)}`;

      const vehicle = await prisma.vehicle.create({
        data: {
          operator_id: operator.id,
          plate_number: plateNumber,
          make,
          model,
          vehicle_type: vehicleType,
          status: getRandomElement(['AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'AVAILABLE']),
          capacity_kg: vehicleType === 'MOTORCYCLE' ? 50 : vehicleType === 'CAR' ? 200 : vehicleType === 'VAN' ? 1000 : 5000,
        },
      });
      vehicles.push(vehicle);
    }
  }
  console.log(`  ✅ Created ${vehicles.length} vehicles`);

  // Create drivers (2-3 per vehicle)
  console.log('👨‍✈️ Creating drivers...');
  const drivers = [];
  for (const operator of operators) {
    const operatorVehicles = vehicles.filter(v => v.operator_id === operator.id);
    for (const vehicle of operatorVehicles) {
      const driverCount = Math.floor(Math.random() * 2) + 2; // 2-3 drivers per vehicle
      for (let i = 0; i < driverCount; i++) {
        const firstName = getRandomElement(rwandanFirstNames);
        const lastName = getRandomElement(rwandanLastNames);
        const name = `${firstName} ${lastName}`;
        const phone = getRandomPhone();
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@tumanow.rw`;

        const driver = await prisma.driver.create({
          data: {
            operator_id: operator.id,
            name,
            phone,
            email,
            license_number: `DL${Math.floor(100000 + Math.random() * 900000)}`,
            status: getRandomElement(['AVAILABLE', 'ASSIGNED', 'BUSY', 'AVAILABLE']),
            vehicle_drivers: {
              create: {
                vehicle_id: vehicle.id,
                is_primary: i === 0,
              },
            },
          },
        });
        drivers.push(driver);
      }
    }
  }
  console.log(`  ✅ Created ${drivers.length} drivers`);

  // Create customer users (20-30)
  console.log('👥 Creating customers...');
  const customers = [];
  const customerCount = Math.floor(Math.random() * 11) + 20; // 20-30 customers
  for (let i = 0; i < customerCount; i++) {
    const firstName = getRandomElement(rwandanFirstNames);
    const lastName = getRandomElement(rwandanLastNames);
    const name = `${firstName} ${lastName}`;
    const phone = getRandomPhone();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@tumanow.rw`;

    const customer = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password_hash: passwordHash,
        status: 'ACTIVE',
        is_customer: true,
        customer_type: getRandomElement(['INDIVIDUAL', 'BUSINESS']),
        user_roles: {
          create: {
            role_id: customerRole.id,
          },
        },
      },
    });
    customers.push(customer);
  }
  console.log(`  ✅ Created ${customers.length} customers`);

  // Create orders for past 2 months
  console.log('📦 Creating orders (past 2 months)...');
  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Delete existing orders first to avoid duplicates
  await prisma.order.deleteMany({});
  await prisma.payment.deleteMany({});

  const orders = [];
  const orderCount = Math.floor(Math.random() * 51) + 50; // 50-100 orders

  for (let i = 0; i < orderCount; i++) {
    const operator = getRandomElement(operators);
    const customer = getRandomElement(customers);
    const createdDate = getRandomDate(twoMonthsAgo, now);
    
    // Determine status based on creation date (older orders more likely to be completed)
    const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    let status = 'CREATED';
    if (daysSinceCreation > 30) {
      status = getRandomElement(['DELIVERED', 'COMPLETED', 'DELIVERED', 'COMPLETED', 'CANCELLED']);
    } else if (daysSinceCreation > 7) {
      status = getRandomElement(['IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'ASSIGNED', 'PICKED_UP']);
    } else {
      status = getRandomElement(['CREATED', 'PENDING_OPERATOR_ACTION', 'APPROVED', 'AWAITING_PAYMENT', 'PAID', 'ASSIGNED']);
    }

    const pickupLocation = getRandomElement(locations);
    const deliveryLocation = getRandomElement(locations);

    // Assign vehicle if order is assigned or in transit
    let vehicleId = null;
    let driverId = null;
    if (['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status)) {
      const operatorVehicles = vehicles.filter(v => v.operator_id === operator.id);
      if (operatorVehicles.length > 0) {
        vehicleId = getRandomElement(operatorVehicles).id;
        // Get a driver for this vehicle
        const vehicleDrivers = drivers.filter(d => 
          d.operator_id === operator.id
        );
        if (vehicleDrivers.length > 0) {
          driverId = getRandomElement(vehicleDrivers).id;
        }
      }
    }

    const basePrice = Math.floor(Math.random() * 50000) + 5000; // 5,000 - 55,000 RWF
    const distance = Math.floor(Math.random() * 50) + 5; // 5-55 km
    const surcharges = Math.floor(Math.random() * 5000);
    const totalPrice = basePrice + surcharges;

    const order = await prisma.order.create({
      data: {
        operator_id: operator.id,
        customer_id: customer.id,
        order_number: `ORD-${Date.now()}-${i}`,
        pickup_address: pickupLocation,
        pickup_contact_name: customer.name,
        pickup_contact_phone: customer.phone,
        delivery_address: deliveryLocation,
        delivery_contact_name: customer.name,
        delivery_contact_phone: customer.phone,
        pickup_lat: (-1.9441 + (Math.random() - 0.5) * 0.1).toString(),
        pickup_lng: (30.0619 + (Math.random() - 0.5) * 0.1).toString(),
        delivery_lat: (-1.9441 + (Math.random() - 0.5) * 0.1).toString(),
        delivery_lng: (30.0619 + (Math.random() - 0.5) * 0.1).toString(),
        status: status as any,
        delivery_mode: getRandomElement(['SAME_DAY', 'NEXT_DAY', 'SCHEDULED', 'EXPRESS']),
        item_type: getRandomElement(['DOCUMENTS', 'SMALL_PARCEL', 'ELECTRONICS', 'FRAGILE']),
        item_description: `Package from ${pickupLocation} to ${deliveryLocation}`,
        weight_kg: (Math.floor(Math.random() * 20) + 1).toString(),
        base_price: basePrice.toString(),
        distance_km: distance.toString(),
        surcharges: surcharges.toString(),
        total_price: totalPrice.toString(),
        created_at: createdDate,
        updated_at: status === 'DELIVERED' || status === 'COMPLETED' 
          ? new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : createdDate,
        // Create order assignment if vehicle is assigned
        order_assignments: vehicleId ? {
          create: {
            vehicle_id: vehicleId,
            driver_id: driverId,
            assigned_at: new Date(createdDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000),
          },
        } : undefined,
      },
    });
    orders.push(order);

    // Create payment if order is paid or completed
    if (['PAID', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status)) {
      const amount = Math.floor(Math.random() * 50000) + 5000; // 5,000 - 55,000 RWF
      const paymentStatus = status === 'DELIVERED' || status === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
      await prisma.payment.create({
        data: {
          operator_id: operator.id,
          order_id: order.id,
          customer_id: customer.id,
          amount: amount.toString(),
          status: paymentStatus as any,
          method: getRandomElement(['MOBILE_MONEY', 'CARD', 'COD']) as any,
          paid_at: paymentStatus === 'COMPLETED' ? new Date(createdDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000) : null,
          created_at: new Date(createdDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`  ✅ Created ${orders.length} orders`);

  console.log('\n🎉 Data population completed!');
  console.log(`\nSummary:`);
  console.log(`  - Operators: ${operators.length}`);
  console.log(`  - Vehicles: ${vehicles.length}`);
  console.log(`  - Drivers: ${drivers.length}`);
  console.log(`  - Customers: ${customers.length}`);
  console.log(`  - Orders: ${orders.length}`);
  console.log(`  - Date range: ${twoMonthsAgo.toLocaleDateString()} to ${now.toLocaleDateString()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

