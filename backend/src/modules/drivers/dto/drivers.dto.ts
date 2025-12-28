import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';

export class CreateDriverDto {
  @ApiProperty({ description: 'Operator ID', example: 'uuid' })
  @IsUUID()
  operator_id: string;

  @ApiProperty({ description: 'Driver name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Driver phone number', example: '+250788123456' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Driver email', example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'License number', example: 'DL123456' })
  @IsOptional()
  @IsString()
  license_number?: string;

  @ApiPropertyOptional({ description: 'Driver status', enum: DriverStatus, example: 'AVAILABLE' })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ description: 'User ID if driver has an account', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}

export class UpdateDriverDto {
  @ApiPropertyOptional({ description: 'Driver name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Driver phone number', example: '+250788123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Driver email', example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'License number', example: 'DL123456' })
  @IsOptional()
  @IsString()
  license_number?: string;

  @ApiPropertyOptional({ description: 'Driver status', enum: DriverStatus, example: 'AVAILABLE' })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ description: 'User ID if driver has an account', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}

export class QueryDriversDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by status', enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'Search by name, phone, or license number' })
  @IsOptional()
  @IsString()
  search?: string;
}

