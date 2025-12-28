import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, ItemType, DeliveryMode } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ description: 'Operator ID', example: 'uuid' })
  @IsUUID()
  operator_id: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid' })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ description: 'Pickup address', example: 'Kigali, Nyarugenge' })
  @IsString()
  pickup_address: string;

  @ApiPropertyOptional({ description: 'Pickup latitude', example: -1.9441 })
  @IsOptional()
  @IsNumber()
  pickup_lat?: number;

  @ApiPropertyOptional({ description: 'Pickup longitude', example: 30.0619 })
  @IsOptional()
  @IsNumber()
  pickup_lng?: number;

  @ApiPropertyOptional({ description: 'Pickup contact name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  pickup_contact_name?: string;

  @ApiProperty({ description: 'Pickup contact phone', example: '+250788123456' })
  @IsString()
  pickup_contact_phone: string;

  @ApiProperty({ description: 'Delivery address', example: 'Rubavu, Western Province' })
  @IsString()
  delivery_address: string;

  @ApiPropertyOptional({ description: 'Delivery latitude', example: -1.9441 })
  @IsOptional()
  @IsNumber()
  delivery_lat?: number;

  @ApiPropertyOptional({ description: 'Delivery longitude', example: 30.0619 })
  @IsOptional()
  @IsNumber()
  delivery_lng?: number;

  @ApiPropertyOptional({ description: 'Delivery contact name', example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  delivery_contact_name?: string;

  @ApiProperty({ description: 'Delivery contact phone', example: '+250788654321' })
  @IsString()
  delivery_contact_phone: string;

  @ApiProperty({ description: 'Item type', enum: ItemType, example: 'SMALL_PARCEL' })
  @IsEnum(ItemType)
  item_type: ItemType;

  @ApiPropertyOptional({ description: 'Item description', example: 'Electronics package' })
  @IsOptional()
  @IsString()
  item_description?: string;

  @ApiPropertyOptional({ description: 'Weight in kg', example: 5.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight_kg?: number;

  @ApiPropertyOptional({ description: 'Dimensions in cm (JSON string)', example: '{"length": 30, "width": 20, "height": 15}' })
  @IsOptional()
  @IsString()
  dimensions_cm?: string;

  @ApiPropertyOptional({ description: 'Declared value', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declared_value?: number;

  @ApiPropertyOptional({ description: 'Is fragile', example: false })
  @IsOptional()
  @IsBoolean()
  is_fragile?: boolean;

  @ApiPropertyOptional({ description: 'Is insured', example: false })
  @IsOptional()
  @IsBoolean()
  is_insured?: boolean;

  @ApiProperty({ description: 'Delivery mode', enum: DeliveryMode, example: 'SAME_DAY' })
  @IsEnum(DeliveryMode)
  delivery_mode: DeliveryMode;

  @ApiPropertyOptional({ description: 'Scheduled pickup time', example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduled_pickup_time?: string;

  @ApiPropertyOptional({ description: 'Scheduled delivery time', example: '2024-01-15T16:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduled_delivery_time?: string;

  @ApiProperty({ description: 'Base price', example: 5000 })
  @IsNumber()
  @Min(0)
  base_price: number;

  @ApiPropertyOptional({ description: 'Distance in km', example: 25.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance_km?: number;

  @ApiPropertyOptional({ description: 'Surcharges', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  surcharges?: number;

  @ApiPropertyOptional({ description: 'Insurance fee', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insurance_fee?: number;

  @ApiProperty({ description: 'Total price', example: 5000 })
  @IsNumber()
  @Min(0)
  total_price: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'Order status', enum: OrderStatus, example: 'ASSIGNED' })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Rejection reason (if status is rejected)', example: 'Out of service area' })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

export class QueryOrdersDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by status', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional({ description: 'Search by order number' })
  @IsOptional()
  @IsString()
  search?: string;
}

