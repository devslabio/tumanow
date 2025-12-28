import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Operator ID', example: 'uuid' })
  @IsUUID()
  operator_id: string;

  @ApiProperty({ description: 'License plate number', example: 'RAA123A' })
  @IsString()
  plate_number: string;

  @ApiProperty({ description: 'Vehicle make', example: 'Toyota' })
  @IsString()
  make: string;

  @ApiProperty({ description: 'Vehicle model', example: 'Hilux' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'Vehicle type', enum: ['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'], example: 'VAN' })
  @IsEnum(['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'])
  vehicle_type: string;

  @ApiPropertyOptional({ description: 'Capacity in kg', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity_kg?: number;

  @ApiPropertyOptional({ description: 'Current latitude', example: -1.9441 })
  @IsOptional()
  @IsNumber()
  current_location_lat?: number;

  @ApiPropertyOptional({ description: 'Current longitude', example: 30.0619 })
  @IsOptional()
  @IsNumber()
  current_location_lng?: number;

  @ApiPropertyOptional({ description: 'Vehicle year', example: 2023 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Vehicle status', enum: VehicleStatus, example: 'AVAILABLE' })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ description: 'License plate number', example: 'RAA123A' })
  @IsOptional()
  @IsString()
  plate_number?: string;

  @ApiPropertyOptional({ description: 'Vehicle make', example: 'Toyota' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'Hilux' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Vehicle type', enum: ['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'], example: 'VAN' })
  @IsOptional()
  @IsEnum(['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'])
  vehicle_type?: string;

  @ApiPropertyOptional({ description: 'Capacity in kg', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity_kg?: number;

  @ApiPropertyOptional({ description: 'Current latitude', example: -1.9441 })
  @IsOptional()
  @IsNumber()
  current_location_lat?: number;

  @ApiPropertyOptional({ description: 'Current longitude', example: 30.0619 })
  @IsOptional()
  @IsNumber()
  current_location_lng?: number;

  @ApiPropertyOptional({ description: 'Vehicle year', example: 2023 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Vehicle status', enum: VehicleStatus, example: 'AVAILABLE' })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}

export class QueryVehiclesDto {
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

  @ApiPropertyOptional({ description: 'Filter by status', enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'Filter by vehicle type', enum: ['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'] })
  @IsOptional()
  @IsEnum(['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'])
  vehicle_type?: string;

  @ApiPropertyOptional({ description: 'Search by plate number, make, or model' })
  @IsOptional()
  @IsString()
  search?: string;
}
