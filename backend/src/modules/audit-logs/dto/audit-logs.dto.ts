import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Filter by action', example: 'CREATE' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type', example: 'Order' })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Search in action, entity_type, or entity_id' })
  @IsOptional()
  @IsString()
  search?: string;
}

