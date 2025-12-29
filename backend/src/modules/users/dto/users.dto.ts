import { IsString, IsOptional, IsEnum, IsEmail, IsUUID, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Phone number', example: '+250788123456' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Password (min 6 characters)', example: 'password123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Operator ID (for operator users)' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiProperty({ description: 'Role codes', example: ['CUSTOMER'] })
  @IsArray()
  @IsString({ each: true })
  role_codes: string[];

  @ApiPropertyOptional({ description: 'User status', enum: UserStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+250788123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Operator ID (for operator users)' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'User status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class AssignRolesDto {
  @ApiProperty({ description: 'Role codes to assign', example: ['OPERATOR_ADMIN', 'DISPATCHER'] })
  @IsArray()
  @IsString({ each: true })
  role_codes: string[];
}

export class QueryUsersDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'Filter by role code' })
  @IsOptional()
  @IsString()
  role_code?: string;

  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;
}

