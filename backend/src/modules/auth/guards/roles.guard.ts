import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { Roles } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Get user roles from database
    const userRoles = await this.prisma.userRole.findMany({
      where: { user_id: user.id },
      include: { role: true },
    });

    const userRoleCodes = userRoles.map(ur => ur.role.code);

    // Role hierarchy: SUPER_ADMIN bypasses all role checks
    if (userRoleCodes.includes('SUPER_ADMIN')) {
      return true;
    }

    // Check if user has any of the required roles
    return requiredRoles.some(role => userRoleCodes.includes(role));
  }
}

