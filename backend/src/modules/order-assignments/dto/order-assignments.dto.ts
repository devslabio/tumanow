import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderAssignmentDto {
  @ApiProperty({ description: 'Order ID', example: 'uuid' })
  @IsUUID()
  order_id: string;

  @ApiProperty({ description: 'Vehicle ID', example: 'uuid' })
  @IsUUID()
  vehicle_id: string;

  @ApiPropertyOptional({ description: 'Driver ID (optional, can be assigned later)', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  driver_id?: string;
}

export class UpdateOrderAssignmentDto {
  @ApiPropertyOptional({ description: 'Vehicle ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({ description: 'Driver ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  driver_id?: string;
}

export class QueryOrderAssignmentsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsUUID()
  order_id?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle ID' })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({ description: 'Filter by driver ID' })
  @IsOptional()
  @IsUUID()
  driver_id?: string;
}

