-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('CREATED', 'PENDING_OPERATOR_ACTION', 'APPROVED', 'REJECTED', 'AWAITING_PAYMENT', 'PAID', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('MOBILE_MONEY', 'CARD', 'COD', 'CORPORATE');

-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."DriverStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."PODType" AS ENUM ('OTP', 'PHOTO', 'SIGNATURE');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('DOCUMENTS', 'SMALL_PARCEL', 'ELECTRONICS', 'FRAGILE', 'PERISHABLES', 'BULKY');

-- CreateEnum
CREATE TYPE "public"."DeliveryMode" AS ENUM ('SAME_DAY', 'NEXT_DAY', 'SCHEDULED', 'EXPRESS', 'INTERCITY');

-- CreateEnum
CREATE TYPE "public"."RejectionCode" AS ENUM ('OUT_OF_COVERAGE', 'UNSUPPORTED_ITEM', 'CAPACITY_EXCEEDED', 'INVALID_ADDRESS', 'CUSTOMER_NO_SHOW', 'PAYMENT_FAILED', 'SYSTEM_ERROR');

-- CreateTable
CREATE TABLE "public"."operators" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."operator_configs" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "supports_documents" BOOLEAN NOT NULL DEFAULT false,
    "supports_small_parcel" BOOLEAN NOT NULL DEFAULT false,
    "supports_electronics" BOOLEAN NOT NULL DEFAULT false,
    "supports_fragile" BOOLEAN NOT NULL DEFAULT false,
    "supports_perishables" BOOLEAN NOT NULL DEFAULT false,
    "supports_bulky" BOOLEAN NOT NULL DEFAULT false,
    "max_weight_kg" DECIMAL(10,2),
    "max_dimensions_cm" TEXT,
    "max_declared_value" DECIMAL(12,2),
    "supports_same_day" BOOLEAN NOT NULL DEFAULT false,
    "supports_next_day" BOOLEAN NOT NULL DEFAULT false,
    "supports_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "supports_express" BOOLEAN NOT NULL DEFAULT false,
    "supports_intercity" BOOLEAN NOT NULL DEFAULT false,
    "supports_prepaid" BOOLEAN NOT NULL DEFAULT true,
    "supports_cod" BOOLEAN NOT NULL DEFAULT false,
    "supports_corporate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "operator_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_customer" BOOLEAN NOT NULL DEFAULT false,
    "customer_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "code" TEXT,
    "plate_number" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "vehicle_type" TEXT,
    "capacity_kg" DECIMAL(10,2),
    "capacity_dimensions" TEXT,
    "status" "public"."VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "current_location_lat" DECIMAL(10,7),
    "current_location_lng" DECIMAL(10,7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drivers" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "license_number" TEXT,
    "status" "public"."DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_drivers" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'CREATED',
    "pickup_address" TEXT NOT NULL,
    "pickup_lat" DECIMAL(10,7),
    "pickup_lng" DECIMAL(10,7),
    "pickup_contact_name" TEXT,
    "pickup_contact_phone" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "delivery_lat" DECIMAL(10,7),
    "delivery_lng" DECIMAL(10,7),
    "delivery_contact_name" TEXT,
    "delivery_contact_phone" TEXT NOT NULL,
    "item_type" "public"."ItemType" NOT NULL,
    "item_description" TEXT,
    "weight_kg" DECIMAL(10,2),
    "dimensions_cm" TEXT,
    "declared_value" DECIMAL(12,2),
    "is_fragile" BOOLEAN NOT NULL DEFAULT false,
    "is_insured" BOOLEAN NOT NULL DEFAULT false,
    "delivery_mode" "public"."DeliveryMode" NOT NULL,
    "scheduled_pickup_time" TIMESTAMP(3),
    "scheduled_delivery_time" TIMESTAMP(3),
    "base_price" DECIMAL(12,2) NOT NULL,
    "distance_km" DECIMAL(10,2),
    "surcharges" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "insurance_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(12,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_rfq" BOOLEAN NOT NULL DEFAULT false,
    "rfq_quote_amount" DECIMAL(12,2),
    "rfq_approved_at" TIMESTAMP(3),
    "rejection_code" "public"."RejectionCode",
    "rejection_reason" TEXT,
    "pod_type" "public"."PODType",
    "pod_otp" TEXT,
    "pod_photo_url" TEXT,
    "pod_signature_url" TEXT,
    "pod_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_assignments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "status_from" "public"."OrderStatus" NOT NULL,
    "status_to" "public"."OrderStatus" NOT NULL,
    "changed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "gateway_response" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tracking_events" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "location_lat" DECIMAL(10,7),
    "location_lng" DECIMAL(10,7),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "operator_id" UUID,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "sent_email" BOOLEAN NOT NULL DEFAULT false,
    "sent_sms" BOOLEAN NOT NULL DEFAULT false,
    "sent_push" BOOLEAN NOT NULL DEFAULT false,
    "sent_in_app" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "operator_id" UUID,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operators_code_key" ON "public"."operators"("code");

-- CreateIndex
CREATE INDEX "operators_code_idx" ON "public"."operators"("code");

-- CreateIndex
CREATE INDEX "operators_status_idx" ON "public"."operators"("status");

-- CreateIndex
CREATE UNIQUE INDEX "operator_configs_operator_id_key" ON "public"."operator_configs"("operator_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE INDEX "users_operator_id_idx" ON "public"."users"("operator_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "public"."users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "public"."roles"("code");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "public"."user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "public"."user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "public"."user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "public"."permissions"("code");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "public"."role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "public"."role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "public"."role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_code_key" ON "public"."vehicles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "public"."vehicles"("plate_number");

-- CreateIndex
CREATE INDEX "vehicles_operator_id_idx" ON "public"."vehicles"("operator_id");

-- CreateIndex
CREATE INDEX "vehicles_plate_number_idx" ON "public"."vehicles"("plate_number");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "public"."vehicles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "public"."drivers"("user_id");

-- CreateIndex
CREATE INDEX "drivers_operator_id_idx" ON "public"."drivers"("operator_id");

-- CreateIndex
CREATE INDEX "drivers_phone_idx" ON "public"."drivers"("phone");

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "public"."drivers"("status");

-- CreateIndex
CREATE INDEX "vehicle_drivers_vehicle_id_idx" ON "public"."vehicle_drivers"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_drivers_driver_id_idx" ON "public"."vehicle_drivers"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_drivers_vehicle_id_driver_id_key" ON "public"."vehicle_drivers"("vehicle_id", "driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "public"."orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_operator_id_idx" ON "public"."orders"("operator_id");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "public"."orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "public"."orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "public"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "public"."orders"("created_at");

-- CreateIndex
CREATE INDEX "order_assignments_order_id_idx" ON "public"."order_assignments"("order_id");

-- CreateIndex
CREATE INDEX "order_assignments_vehicle_id_idx" ON "public"."order_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "order_assignments_driver_id_idx" ON "public"."order_assignments"("driver_id");

-- CreateIndex
CREATE INDEX "order_history_order_id_idx" ON "public"."order_history"("order_id");

-- CreateIndex
CREATE INDEX "order_history_created_at_idx" ON "public"."order_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "public"."payments"("transaction_id");

-- CreateIndex
CREATE INDEX "payments_operator_id_idx" ON "public"."payments"("operator_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "public"."payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "public"."payments"("customer_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_transaction_id_idx" ON "public"."payments"("transaction_id");

-- CreateIndex
CREATE INDEX "tracking_events_order_id_idx" ON "public"."tracking_events"("order_id");

-- CreateIndex
CREATE INDEX "tracking_events_created_at_idx" ON "public"."tracking_events"("created_at");

-- CreateIndex
CREATE INDEX "notifications_operator_id_idx" ON "public"."notifications"("operator_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_operator_id_idx" ON "public"."audit_logs"("operator_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "public"."operator_configs" ADD CONSTRAINT "operator_configs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drivers" ADD CONSTRAINT "drivers_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_drivers" ADD CONSTRAINT "vehicle_drivers_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_drivers" ADD CONSTRAINT "vehicle_drivers_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_assignments" ADD CONSTRAINT "order_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_assignments" ADD CONSTRAINT "order_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_history" ADD CONSTRAINT "order_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_events" ADD CONSTRAINT "tracking_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
