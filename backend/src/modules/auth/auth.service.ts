import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
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

