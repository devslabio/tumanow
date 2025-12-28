import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsEmail, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOperatorDto {
  @ApiProperty({ description: 'Operator code (unique identifier)', example: 'OP001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Operator name', example: 'Kigali Express Delivery' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Operator email', example: 'info@kigalidelivery.rw' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Operator phone', example: '+250788123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Operator status', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;
}

export class UpdateOperatorDto {
  @ApiPropertyOptional({ description: 'Operator name', example: 'Kigali Express Delivery' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Operator email', example: 'info@kigalidelivery.rw' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Operator phone', example: '+250788123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Operator status', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;
}

export class UpdateOperatorConfigDto {
  @ApiPropertyOptional({ description: 'Supports documents', example: true })
  @IsOptional()
  @IsBoolean()
  supports_documents?: boolean;

  @ApiPropertyOptional({ description: 'Supports small parcel', example: true })
  @IsOptional()
  @IsBoolean()
  supports_small_parcel?: boolean;

  @ApiPropertyOptional({ description: 'Supports electronics', example: true })
  @IsOptional()
  @IsBoolean()
  supports_electronics?: boolean;

  @ApiPropertyOptional({ description: 'Supports fragile items', example: true })
  @IsOptional()
  @IsBoolean()
  supports_fragile?: boolean;

  @ApiPropertyOptional({ description: 'Supports perishables', example: false })
  @IsOptional()
  @IsBoolean()
  supports_perishables?: boolean;

  @ApiPropertyOptional({ description: 'Supports bulky items', example: false })
  @IsOptional()
  @IsBoolean()
  supports_bulky?: boolean;

  @ApiPropertyOptional({ description: 'Maximum weight in kg', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_weight_kg?: number;

  @ApiPropertyOptional({ description: 'Maximum dimensions in cm (JSON string)', example: '{"length": 100, "width": 50, "height": 50}' })
  @IsOptional()
  @IsString()
  max_dimensions_cm?: string;

  @ApiPropertyOptional({ description: 'Supports same day delivery', example: true })
  @IsOptional()
  @IsBoolean()
  supports_same_day?: boolean;

  @ApiPropertyOptional({ description: 'Supports next day delivery', example: true })
  @IsOptional()
  @IsBoolean()
  supports_next_day?: boolean;

  @ApiPropertyOptional({ description: 'Supports scheduled delivery', example: true })
  @IsOptional()
  @IsBoolean()
  supports_scheduled?: boolean;

  @ApiPropertyOptional({ description: 'Supports express delivery', example: true })
  @IsOptional()
  @IsBoolean()
  supports_express?: boolean;

  @ApiPropertyOptional({ description: 'Supports intercity delivery', example: true })
  @IsOptional()
  @IsBoolean()
  supports_intercity?: boolean;

  @ApiPropertyOptional({ description: 'Supports cash on delivery', example: true })
  @IsOptional()
  @IsBoolean()
  supports_cod?: boolean;

  @ApiPropertyOptional({ description: 'Supports card payment', example: true })
  @IsOptional()
  @IsBoolean()
  supports_card?: boolean;

  @ApiPropertyOptional({ description: 'Supports corporate payment', example: false })
  @IsOptional()
  @IsBoolean()
  supports_corporate?: boolean;
}

export class QueryOperatorsDto {
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

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;
}

