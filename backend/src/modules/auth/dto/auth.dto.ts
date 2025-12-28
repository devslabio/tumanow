import { IsString, IsEmail, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Phone number or email address', example: '+250788123456' })
  @IsString()
  phoneOrEmail: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '+250788123456' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'Customer type', enum: ['INDIVIDUAL', 'BUSINESS'], default: 'INDIVIDUAL' })
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'BUSINESS'])
  customerType?: 'INDIVIDUAL' | 'BUSINESS';
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Phone number or email address', example: '+250788123456' })
  @IsString()
  phoneOrEmail: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token', example: 'abc123...' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password', example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  password: string;
}

