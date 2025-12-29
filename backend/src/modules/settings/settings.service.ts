import { Injectable, NotFoundException, ConflictException, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSettingDto, UpdateSettingDto, QuerySettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createSettingDto: CreateSettingDto, userId: string) {
    // Check if key already exists
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: createSettingDto.key },
    });

    if (existing) {
      throw new ConflictException('Setting with this key already exists');
    }

    const setting = await this.prisma.systemSetting.create({
      data: {
        key: createSettingDto.key,
        value: createSettingDto.value,
        category: createSettingDto.category || 'general',
        description: createSettingDto.description,
        is_encrypted: createSettingDto.is_encrypted || false,
        updated_by: userId,
      },
    });

    // Invalidate related caches
    await this.invalidateSettingCache(setting.key, setting.category);

    return setting;
  }

  async findAll(query: QuerySettingsDto) {
    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { key: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const settings = await this.prisma.systemSetting.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    return {
      data: settings,
      grouped,
      categories: Object.keys(grouped),
    };
  }

  async findOne(key: string) {
    const cacheKey = `setting:${key}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    // Cache for 1 hour (settings don't change often)
    await this.cacheManager.set(cacheKey, setting, 3600 * 1000);
    
    return setting;
  }

  async update(key: string, updateSettingDto: UpdateSettingDto, userId: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    const updatedSetting = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        ...updateSettingDto,
        updated_by: userId,
      },
    });

    // Invalidate related caches
    await this.invalidateSettingCache(key, updatedSetting.category);

    return updatedSetting;
  }

  async remove(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
      select: { category: true },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    await this.prisma.systemSetting.delete({
      where: { key },
    });

    // Invalidate related caches
    await this.invalidateSettingCache(key, setting.category);

    return { message: 'Setting deleted successfully' };
  }

  private async invalidateSettingCache(key: string, category: string) {
    await Promise.all([
      this.cacheManager.del(`setting:${key}`),
      this.cacheManager.del(`setting:value:${key}`),
      this.cacheManager.del(`settings:category:${category}`),
      this.cacheManager.del('settings:all'), // Invalidate all settings cache if exists
    ]);
  }

  async getByCategory(category: string) {
    const cacheKey = `settings:category:${category}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const settings = await this.prisma.systemSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, settings, 3600 * 1000);
    
    return settings;
  }

  async getValue(key: string): Promise<string | null> {
    const cacheKey = `setting:value:${key}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get<string | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
      select: { value: true },
    });

    const value = setting?.value || null;
    
    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, value, 3600 * 1000);
    
    return value;
  }
}

