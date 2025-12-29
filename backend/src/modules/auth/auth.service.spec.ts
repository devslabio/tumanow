import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Mock PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// Mock JwtService
const mockJwtService = {
  sign: jest.fn(),
  signAsync: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRATION: '30d',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRATION: '30d',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ phoneOrEmail: '1234567890', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        phone: '1234567890',
        password_hash: 'hashed-password',
        status: 'ACTIVE',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({ phoneOrEmail: '1234567890', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user data on successful login', async () => {
      const mockUser = {
        id: 'user-id',
        phone: '1234567890',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed-password',
        status: 'ACTIVE',
        operator_id: null,
        is_customer: false,
        customer_type: null,
        profile_picture: null,
        notification_preferences: null,
        created_at: new Date(),
        last_login: null,
        user_roles: [],
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      const result = await service.login({ phoneOrEmail: '1234567890', password: 'password' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { last_login: expect.any(Date) },
      });
    });
  });

  describe('register', () => {
    it('should throw ConflictException if phone already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          name: 'Test User',
          phone: '1234567890',
          password: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new user on successful registration', async () => {
      const mockNewUser = {
        id: 'new-user-id',
        name: 'Test User',
        phone: '1234567890',
        email: null,
        status: 'ACTIVE',
        operator_id: null,
        is_customer: false,
        customer_type: null,
        profile_picture: null,
        notification_preferences: null,
        created_at: new Date(),
        last_login: null,
        user_roles: [],
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
      mockPrismaService.user.create.mockResolvedValue(mockNewUser);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      const result = await service.register({
        name: 'Test User',
        phone: '1234567890',
        password: 'password',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });
});

