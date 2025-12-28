import { IsString, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to notify', example: 'uuid' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Notification type', example: 'ORDER_CREATED' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Notification title', example: 'New Order Created' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message', example: 'Your order has been created successfully' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Additional data (JSON string)', example: '{"order_id": "uuid"}' })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({ description: 'Send via email', example: true })
  @IsOptional()
  @IsBoolean()
  send_email?: boolean;

  @ApiPropertyOptional({ description: 'Send via SMS', example: false })
  @IsOptional()
  @IsBoolean()
  send_sms?: boolean;

  @ApiPropertyOptional({ description: 'Send via push notification', example: true })
  @IsOptional()
  @IsBoolean()
  send_push?: boolean;

  @ApiPropertyOptional({ description: 'Send as in-app notification', example: true })
  @IsOptional()
  @IsBoolean()
  send_in_app?: boolean;
}

export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by type', example: 'ORDER_CREATED' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by read status', example: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}

export class MarkAsReadDto {
  @ApiPropertyOptional({ description: 'Mark all notifications as read', example: false })
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

