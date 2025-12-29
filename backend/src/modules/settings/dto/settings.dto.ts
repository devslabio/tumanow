import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ description: 'Setting key (e.g., email.smtp.host)', example: 'email.smtp.host' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Setting value (JSON or plain string)', example: 'smtp.gmail.com' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Setting category', example: 'email' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the value is encrypted', example: false })
  @IsOptional()
  @IsBoolean()
  is_encrypted?: boolean;
}

export class UpdateSettingDto {
  @ApiPropertyOptional({ description: 'Setting value (JSON or plain string)' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: 'Setting category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the value is encrypted' })
  @IsOptional()
  @IsBoolean()
  is_encrypted?: boolean;
}

export class QuerySettingsDto {
  @ApiPropertyOptional({ description: 'Filter by category', example: 'email' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Search by key or description' })
  @IsOptional()
  @IsString()
  search?: string;
}

