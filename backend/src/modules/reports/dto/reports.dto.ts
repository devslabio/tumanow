import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  ORDERS = 'ORDERS',
  REVENUE = 'REVENUE',
  PERFORMANCE = 'PERFORMANCE',
  OPERATOR = 'OPERATOR',
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
}

export class ReportQueryDto {
  @ApiProperty({ description: 'Report type', enum: ReportType, example: 'ORDERS' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by operator ID' })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiPropertyOptional({ description: 'Filter by order status' })
  @IsOptional()
  @IsString()
  order_status?: string;

  @ApiPropertyOptional({ description: 'Export format', enum: ExportFormat })
  @IsOptional()
  @IsEnum(ExportFormat)
  export_format?: ExportFormat;
}

