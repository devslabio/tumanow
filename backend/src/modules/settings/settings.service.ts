import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSettingDto, UpdateSettingDto, QuerySettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

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
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

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

    return updatedSetting;
  }

  async remove(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    await this.prisma.systemSetting.delete({
      where: { key },
    });

    return { message: 'Setting deleted successfully' };
  }

  async getByCategory(category: string) {
    const settings = await this.prisma.systemSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
      select: { value: true },
    });

    return setting?.value || null;
  }
}

