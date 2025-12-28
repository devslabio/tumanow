import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class CreateTrackingEventDto {
  @ApiProperty({ description: 'Order ID', example: 'uuid' })
  @IsUUID()
  order_id: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus, example: 'IN_TRANSIT' })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Latitude', example: -1.9441 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  location_lat?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 30.0619 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  location_lng?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Package picked up from warehouse' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryTrackingEventsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsUUID()
  order_id?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

