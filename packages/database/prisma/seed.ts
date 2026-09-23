import * as bcrypt from "bcrypt";
import {
  BranchAccessScope,
  OperatorStatus,
  PrismaClient,
  ShipmentStatus,
} from "@prisma/client";
import { DEMO_IDS } from "../src/constants";

const prisma = new PrismaClient();

const PLATFORM_PERMISSIONS = [
  { code: "platform.dashboard.view", description: "View platform dashboard" },
  { code: "platform.operator.view", description: "View operators" },
  { code: "platform.operator.create", description: "Create operators" },
  { code: "platform.operator.update", description: "Update operators" },
  { code: "platform.operator.approve", description: "Approve operators" },
  { code: "platform.operator.suspend", description: "Suspend operators" },
  { code: "platform.user.view", description: "View platform users" },
  { code: "platform.user.manage", description: "Manage platform users" },
  { code: "platform.audit.view", description: "View platform audit logs" },
  { code: "platform.settings.manage", description: "Manage platform settings" },
  { code: "platform.role.view", description: "View platform roles" },
  { code: "platform.role.manage", description: "Manage platform roles" },
] as const;

const OPERATOR_PERMISSIONS = [
  { code: "operator.settings.view", description: "View operator settings" },
  { code: "operator.settings.update", description: "Update operator settings" },
  { code: "branch.view", description: "View branches" },
  { code: "branch.create", description: "Create branches" },
  { code: "branch.update", description: "Update branches" },
  { code: "member.view", description: "View operator members" },
  { code: "member.invite", description: "Invite members" },
  { code: "member.update", description: "Update members" },
  { code: "role.view", description: "View operator roles" },
  { code: "role.manage", description: "Manage operator roles" },
  { code: "coverage.view", description: "View coverage areas" },
  { code: "coverage.manage", description: "Manage coverage areas" },
  { code: "package_type.view", description: "View package types" },
  { code: "package_type.manage", description: "Manage package types" },
  { code: "orders.view", description: "View shipments" },
  { code: "orders.create", description: "Create shipments" },
  { code: "orders.approve", description: "Approve shipments" },
  { code: "orders.reject", description: "Reject shipments" },
  { code: "orders.assign", description: "Assign drivers" },
  { code: "orders.update_status", description: "Update shipment status" },
  { code: "orders.cancel", description: "Cancel shipments" },
  { code: "drivers.view", description: "View drivers" },
  { code: "drivers.manage", description: "Manage drivers" },
  { code: "fleet.view", description: "View vehicles" },
  { code: "fleet.manage", description: "Manage vehicles" },
  { code: "pricing.view", description: "View pricing" },
  { code: "pricing.manage", description: "Manage pricing" },
  { code: "payments.view", description: "View payments" },
  { code: "payments.manage", description: "Manage payments" },
  { code: "quotations.view", description: "View quotations" },
  { code: "quotations.manage", description: "Manage quotations" },
  { code: "returns.manage", description: "Manage returns" },
  { code: "notifications.view", description: "View notifications" },
  { code: "reports.view", description: "View reports" },
  { code: "audit.view", description: "View audit logs" },
  { code: "integrations.manage", description: "Manage API keys and webhooks" },
] as const;

const CUSTOMER_PERMISSIONS = [
  { code: "customer.shipments.view", description: "View own shipments" },
  { code: "customer.shipments.create", description: "Create shipments" },
  { code: "customer.addresses.manage", description: "Manage saved addresses" },
  { code: "customer.payments.view", description: "View payment history" },
  { code: "customer.payments.pay", description: "Pay for shipments" },
  { code: "customer.profile.manage", description: "Manage profile" },
  { code: "notifications.view", description: "View notifications" },
] as const;

async function upsertPermissions(
  rows: readonly { code: string; description: string }[],
) {
  for (const row of rows) {
    await prisma.permission.upsert({
      where: { code: row.code },
      create: row,
      update: { description: row.description },
    });
  }
}

async function syncRolePermissions(roleId: string, codes: string[]) {
  const permissions = await prisma.permission.findMany({
    where: { code: { in: codes } },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  if (permissions.length === 0) return;
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    skipDuplicates: true,
  });
}

async function upsertPlatformRole(input: {
  key: string;
  name: string;
  description: string;
  permissionCodes: string[];
}) {
  const existing = await prisma.role.findFirst({
    where: { key: input.key, operatorId: null },
  });
  const role = existing
    ? await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          description: input.description,
          isPlatformRole: true,
        },
      })
    : await prisma.role.create({
        data: {
          key: input.key,
          name: input.name,
          description: input.description,
          isPlatformRole: true,
        },
      });
  await syncRolePermissions(role.id, input.permissionCodes);
  return role;
}

async function upsertOperatorRole(
  operatorId: string,
  input: {
    key: string;
    name: string;
    description: string;
    permissionCodes: string[];
  },
) {
  const existing = await prisma.role.findFirst({
    where: { key: input.key, operatorId },
  });
  const role = existing
    ? await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          description: input.description,
        },
      })
    : await prisma.role.create({
        data: {
          key: input.key,
          name: input.name,
          description: input.description,
          isPlatformRole: false,
          operatorId,
        },
      });
  await syncRolePermissions(role.id, input.permissionCodes);
  return role;
}

async function main() {
  await upsertPermissions([
    ...PLATFORM_PERMISSIONS,
    ...OPERATOR_PERMISSIONS,
    ...CUSTOMER_PERMISSIONS,
  ]);

  const allPlatform = PLATFORM_PERMISSIONS.map((p) => p.code);
  const allOperator = OPERATOR_PERMISSIONS.map((p) => p.code);
  const allCustomer = CUSTOMER_PERMISSIONS.map((p) => p.code);

  const superAdminRole = await upsertPlatformRole({
    key: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Full platform access",
    permissionCodes: allPlatform,
  });

  const plan = await prisma.subscriptionPlan.upsert({
    where: { key: "standard" },
    create: {
      key: "standard",
      name: "Standard",
      description: "Default operator plan",
      maxBranches: 10,
      maxUsers: 50,
      maxDrivers: 100,
      modules: ["shipments", "drivers", "pricing", "tracking"],
    },
    update: {},
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@tumanow.rw" },
    create: {
      id: DEMO_IDS.userPlatformAdmin,
      email: "admin@tumanow.rw",
      passwordHash,
      fullName: "Platform Admin",
      phone: "+250780000001",
    },
    update: { passwordHash, fullName: "Platform Admin" },
  });

  await prisma.userPlatformRole.upsert({
    where: {
      userId_roleId: {
        userId: platformAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    create: { userId: platformAdmin.id, roleId: superAdminRole.id },
    update: {},
  });

  const ritco = await prisma.operator.upsert({
    where: { code: "ritco" },
    create: {
      id: DEMO_IDS.operatorRitco,
      code: "ritco",
      legalName: "RITCO Ltd",
      tradingName: "RITCO",
      email: "info@ritco.rw",
      phone: "+250788123456",
      city: "Kigali",
      country: "RW",
      status: OperatorStatus.ACTIVE,
      subscriptionPlanId: plan.id,
    },
    update: {
      status: OperatorStatus.ACTIVE,
      subscriptionPlanId: plan.id,
    },
  });

  const volcano = await prisma.operator.upsert({
    where: { code: "volcano" },
    create: {
      id: DEMO_IDS.operatorVolcano,
      code: "volcano",
      legalName: "Volcano Express Ltd",
      tradingName: "Volcano Express",
      email: "info@volcano.rw",
      phone: "+250788654321",
      city: "Kigali",
      country: "RW",
      status: OperatorStatus.ACTIVE,
      subscriptionPlanId: plan.id,
    },
    update: {
      status: OperatorStatus.ACTIVE,
      subscriptionPlanId: plan.id,
    },
  });

  await prisma.branch.upsert({
    where: {
      operatorId_code: { operatorId: ritco.id, code: "kigali-hq" },
    },
    create: {
      id: DEMO_IDS.branchRitcoKigali,
      operatorId: ritco.id,
      code: "kigali-hq",
      name: "Kigali HQ",
      city: "Kigali",
      country: "RW",
      addressLine1: "KN 4 Ave, Kigali",
    },
    update: {},
  });

  await prisma.branch.upsert({
    where: {
      operatorId_code: { operatorId: volcano.id, code: "kigali-hq" },
    },
    create: {
      id: DEMO_IDS.branchVolcanoKigali,
      operatorId: volcano.id,
      code: "kigali-hq",
      name: "Kigali Hub",
      city: "Kigali",
      country: "RW",
      addressLine1: "KG 7 Ave, Kigali",
    },
    update: {},
  });

  const ritcoAdminRole = await upsertOperatorRole(ritco.id, {
    key: "OPERATOR_ADMIN",
    name: "Operator Admin",
    description: "Full operator access",
    permissionCodes: allOperator,
  });

  const ritcoDriverRole = await upsertOperatorRole(ritco.id, {
    key: "DRIVER",
    name: "Driver",
    description: "Rider app access",
    permissionCodes: [
      "orders.view",
      "orders.update_status",
      "drivers.view",
    ],
  });

  await upsertOperatorRole(volcano.id, {
    key: "OPERATOR_ADMIN",
    name: "Operator Admin",
    description: "Full operator access",
    permissionCodes: allOperator,
  });

  const ritcoAdmin = await prisma.user.upsert({
    where: { email: "ritcoadmin@tumanow.rw" },
    create: {
      id: DEMO_IDS.userRitcoAdmin,
      email: "ritcoadmin@tumanow.rw",
      passwordHash,
      fullName: "RITCO Admin",
      phone: "+250780000002",
    },
    update: { passwordHash },
  });

  const volcanoAdmin = await prisma.user.upsert({
    where: { email: "volcano@tumanow.rw" },
    create: {
      id: DEMO_IDS.userVolcanoAdmin,
      email: "volcano@tumanow.rw",
      passwordHash,
      fullName: "Volcano Admin",
      phone: "+250780000003",
    },
    update: { passwordHash },
  });

  const ritcoMembership = await prisma.operatorMembership.upsert({
    where: {
      operatorId_userId: { operatorId: ritco.id, userId: ritcoAdmin.id },
    },
    create: {
      operatorId: ritco.id,
      userId: ritcoAdmin.id,
      roleId: ritcoAdminRole.id,
      accessScope: BranchAccessScope.ALL_BRANCHES,
      joinedAt: new Date(),
    },
    update: {},
  });

  const volcanoAdminRole = await prisma.role.findFirst({
    where: { key: "OPERATOR_ADMIN", operatorId: volcano.id },
  });

  if (volcanoAdminRole) {
    await prisma.operatorMembership.upsert({
      where: {
        operatorId_userId: { operatorId: volcano.id, userId: volcanoAdmin.id },
      },
      create: {
        operatorId: volcano.id,
        userId: volcanoAdmin.id,
        roleId: volcanoAdminRole.id,
        accessScope: BranchAccessScope.ALL_BRANCHES,
        joinedAt: new Date(),
      },
      update: {},
    });
  }

  const customerRole = await upsertPlatformRole({
    key: "CUSTOMER",
    name: "Customer",
    description: "End customer account",
    permissionCodes: allCustomer,
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@tumanow.rw" },
    create: {
      id: DEMO_IDS.userCustomer,
      email: "customer@tumanow.rw",
      passwordHash,
      fullName: "Jean Uwimana",
      phone: "+250780000004",
    },
    update: { passwordHash },
  });

  await prisma.userPlatformRole.upsert({
    where: {
      userId_roleId: { userId: customerUser.id, roleId: customerRole.id },
    },
    create: { userId: customerUser.id, roleId: customerRole.id },
    update: {},
  });

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    create: {
      id: DEMO_IDS.customerProfile,
      userId: customerUser.id,
      fullName: "Jean Uwimana",
      email: "customer@tumanow.rw",
      phone: "+250780000004",
    },
    update: {},
  });

  await prisma.customerAddress.upsert({
    where: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    create: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      customerId: customer.id,
      label: "Home",
      addressLine1: "Kacyiru, Kigali",
      city: "Kigali",
      country: "RW",
      isDefault: true,
    },
    update: {},
  });

  const docType = await prisma.packageType.upsert({
    where: {
      operatorId_code: { operatorId: ritco.id, code: "documents" },
    },
    create: {
      operatorId: ritco.id,
      code: "documents",
      name: "Documents",
      maxWeightKg: 2,
      isActive: true,
    },
    update: {},
  });

  await prisma.packageType.upsert({
    where: {
      operatorId_code: { operatorId: ritco.id, code: "small-parcel" },
    },
    create: {
      operatorId: ritco.id,
      code: "small-parcel",
      name: "Small Parcel",
      maxWeightKg: 30,
      isActive: true,
    },
    update: {},
  });

  await prisma.coverageArea.upsert({
    where: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
    create: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      operatorId: ritco.id,
      name: "Kigali City",
      level: "city",
      config: { city: "Kigali", country: "RW" },
    },
    update: {},
  });

  await prisma.pricingRule.upsert({
    where: { id: DEMO_IDS.pricingRitcoStandard },
    create: {
      id: DEMO_IDS.pricingRitcoStandard,
      operatorId: ritco.id,
      name: "RITCO Standard City",
      deliveryService: "STANDARD",
      baseFee: 2000,
      perKmFee: 400,
      perKgFee: 100,
      fragileSurcharge: 1000,
      expressSurcharge: 1500,
      minFee: 2500,
      isActive: true,
    },
    update: {
      baseFee: 2000,
      perKmFee: 400,
      perKgFee: 100,
      fragileSurcharge: 1000,
      isActive: true,
    },
  });

  await prisma.pricingRule.upsert({
    where: { id: DEMO_IDS.pricingRitcoExpress },
    create: {
      id: DEMO_IDS.pricingRitcoExpress,
      operatorId: ritco.id,
      name: "RITCO Express",
      deliveryService: "EXPRESS",
      baseFee: 3500,
      perKmFee: 600,
      perKgFee: 150,
      fragileSurcharge: 1500,
      expressSurcharge: 0,
      minFee: 4000,
      isActive: true,
    },
    update: {
      baseFee: 3500,
      perKmFee: 600,
      isActive: true,
    },
  });

  await prisma.driver.upsert({
    where: { id: DEMO_IDS.driverRitco1 },
    create: {
      id: DEMO_IDS.driverRitco1,
      operatorId: ritco.id,
      branchId: DEMO_IDS.branchRitcoKigali,
      fullName: "Eric Nkurunziza",
      phone: "+250780000010",
      licenseNo: "RW-DRV-1001",
      status: "AVAILABLE",
    },
    update: {
      fullName: "Eric Nkurunziza",
      status: "AVAILABLE",
    },
  });

  await prisma.driver.upsert({
    where: { id: DEMO_IDS.driverRitco2 },
    create: {
      id: DEMO_IDS.driverRitco2,
      operatorId: ritco.id,
      branchId: DEMO_IDS.branchRitcoKigali,
      fullName: "Alice Uwase",
      phone: "+250780000011",
      licenseNo: "RW-DRV-1002",
      status: "OFFLINE",
    },
    update: {
      fullName: "Alice Uwase",
      status: "OFFLINE",
    },
  });

  await prisma.vehicle.upsert({
    where: { id: DEMO_IDS.vehicleRitco1 },
    create: {
      id: DEMO_IDS.vehicleRitco1,
      operatorId: ritco.id,
      registrationNo: "RAD 101 A",
      label: "Moto — Kacyiru",
      type: "MOTORCYCLE",
      status: "AVAILABLE",
      maxWeightKg: 25,
      isActive: true,
    },
    update: {
      label: "Moto — Kacyiru",
      status: "AVAILABLE",
      isActive: true,
    },
  });

  await prisma.vehicle.upsert({
    where: { id: DEMO_IDS.vehicleRitco2 },
    create: {
      id: DEMO_IDS.vehicleRitco2,
      operatorId: ritco.id,
      registrationNo: "RAD 202 B",
      label: "Van — Remera",
      type: "VAN",
      status: "AVAILABLE",
      maxWeightKg: 800,
      isActive: true,
    },
    update: {
      label: "Van — Remera",
      status: "AVAILABLE",
      isActive: true,
    },
  });

  const riderUser = await prisma.user.upsert({
    where: { email: "rider@tumanow.rw" },
    create: {
      id: DEMO_IDS.userRider,
      email: "rider@tumanow.rw",
      passwordHash,
      fullName: "Eric Nkurunziza",
      phone: "+250780000010",
    },
    update: { passwordHash, fullName: "Eric Nkurunziza" },
  });

  await prisma.operatorMembership.upsert({
    where: {
      operatorId_userId: { operatorId: ritco.id, userId: riderUser.id },
    },
    create: {
      operatorId: ritco.id,
      userId: riderUser.id,
      roleId: ritcoDriverRole.id,
      accessScope: BranchAccessScope.ALL_BRANCHES,
      joinedAt: new Date(),
    },
    update: { roleId: ritcoDriverRole.id },
  });

  await prisma.driver.update({
    where: { id: DEMO_IDS.driverRitco1 },
    data: {
      userId: riderUser.id,
      vehicleId: DEMO_IDS.vehicleRitco1,
    },
  });

  const shipment = await prisma.shipment.upsert({
    where: { trackingNumber: "TN-2026-00001234" },
    create: {
      trackingNumber: "TN-2026-00001234",
      operatorId: ritco.id,
      customerId: customer.id,
      status: ShipmentStatus.PAID,
      deliveryService: "STANDARD",
      pickupAddress: "Kacyiru, Kigali",
      pickupCity: "Kigali",
      pickupContactName: "Jean Uwimana",
      pickupContactPhone: "+250780000004",
      deliveryAddress: "Remera, Kigali",
      deliveryCity: "Kigali",
      deliveryContactName: "Marie Mukamana",
      deliveryContactPhone: "+250780000005",
      quotedPrice: 3500,
      finalPrice: 3500,
      packages: {
        create: {
          packageTypeId: docType.id,
          description: "Business documents",
          quantity: 1,
          weightKg: 0.5,
        },
      },
      events: {
        create: [
          { status: ShipmentStatus.CREATED, note: "Shipment created" },
          { status: ShipmentStatus.APPROVED, note: "Approved by operator" },
          { status: ShipmentStatus.PAID, note: "Payment received" },
        ],
      },
    },
    update: {},
  });

  await prisma.shipment.upsert({
    where: { trackingNumber: "TN-2026-00001235" },
    create: {
      trackingNumber: "TN-2026-00001235",
      operatorId: ritco.id,
      customerId: customer.id,
      status: ShipmentStatus.PAID,
      deliveryService: "STANDARD",
      pickupAddress: "Nyamirambo, Kigali",
      pickupCity: "Kigali",
      deliveryAddress: "Kimironko, Kigali",
      deliveryCity: "Kigali",
      quotedPrice: 4500,
      finalPrice: 4500,
      isCod: true,
      codAmount: 4500,
      codCurrency: "RWF",
      codStatus: "PENDING",
      packages: {
        create: {
          packageTypeId: docType.id,
          description: "COD parcel sample",
          quantity: 1,
          weightKg: 1.2,
        },
      },
      events: {
        create: [
          { status: ShipmentStatus.CREATED, note: "COD shipment created" },
          {
            status: ShipmentStatus.APPROVED,
            note: "Approved — cash on delivery",
          },
          {
            status: ShipmentStatus.PAID,
            note: "COD authorized — collect at delivery",
          },
        ],
      },
    },
    update: {
      isCod: true,
      codAmount: 4500,
      codStatus: "PENDING",
    },
  });

  console.info("TumaNow seed complete");
  console.info({
    platformAdmin: platformAdmin.email,
    ritcoAdmin: ritcoAdmin.email,
    volcanoAdmin: volcanoAdmin.email,
    customer: customerUser.email,
    rider: riderUser.email,
    ritcoMembership: ritcoMembership.id,
    demoShipment: shipment.trackingNumber,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
