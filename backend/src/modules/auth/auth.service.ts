import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string) {
    try {
      // Find user by phone or email
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: dto.phoneOrEmail },
            { email: dto.phoneOrEmail },
          ],
        },
      });

      if (!user || !user.password_hash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Account is inactive');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          last_login: new Date(),
        },
      });

      // Get user roles for response
      const userWithRoles = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          operator_id: true,
          user_roles: {
            include: {
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.phone, user.operator_id);

      return {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          operator_id: user.operator_id,
          roles: userWithRoles?.user_roles?.map(ur => ur.role) || [],
        },
        ...tokens,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(dto: RegisterDto) {
    // Check if user exists by phone
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Check email if provided
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingEmail) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user (as customer)
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        password_hash: passwordHash,
        status: 'ACTIVE',
        is_customer: true,
        customer_type: dto.customerType || 'INDIVIDUAL',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        created_at: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.phone, null);

    return {
      user,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.phone, user.operator_id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        operator_id: true,
        is_customer: true,
        customer_type: true,
        profile_picture: true,
        notification_preferences: true,
        created_at: true,
        last_login: true,
        user_roles: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Transform user_roles to roles for frontend compatibility
    return {
      ...user,
      roles: user.user_roles?.map(ur => ur.role) || [],
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    // Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password_hash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date(),
      },
    });

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check for email conflicts
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: userId },
          deleted_at: null,
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check for phone conflicts
    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          id: { not: userId },
          deleted_at: null,
        },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        operator_id: true,
        is_customer: true,
        customer_type: true,
        profile_picture: true,
        notification_preferences: true,
        created_at: true,
        last_login: true,
        user_roles: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      ...updatedUser,
      roles: updatedUser.user_roles?.map(ur => ur.role) || [],
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string) {
    // Find user by phone or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phoneOrEmail },
          { email: dto.phoneOrEmail },
        ],
      },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If an account exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Store reset token in user record
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
    });

    // TODO: Send reset token via email/SMS
    // For now, return token (in production, don't return - send via email/SMS)
    return {
      message: 'Password reset instructions have been sent to your registered phone/email.',
      token: resetToken, // Remove this in production - send via email/SMS only
      expiresIn: '1 hour',
    };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string) {
    // Find user by reset token
    const user = await this.prisma.user.findFirst({
      where: {
        reset_token: dto.token,
        reset_token_expiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    return { message: 'Password has been reset successfully.' };
  }

  private async generateTokens(userId: string, phone: string, operatorId: string | null) {
    try {
      const payload = { sub: userId, phone, operatorId };
      const jwtSecret = this.configService.get('JWT_SECRET');
      
      if (!jwtSecret) {
        console.error('JWT_SECRET is not set!');
        throw new Error('JWT_SECRET is not configured');
      }

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          expiresIn: this.configService.get('JWT_EXPIRATION') || '30d',
        }),
        this.jwtService.signAsync(payload, {
          secret: this.configService.get('JWT_REFRESH_SECRET') || jwtSecret,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '30d',
        }),
      ]);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }
}

