import { Module } from '@nestjs/common';
import { OrderAssignmentsService } from './order-assignments.service';
import { OrderAssignmentsController } from './order-assignments.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrderAssignmentsController],
  providers: [OrderAssignmentsService],
  exports: [OrderAssignmentsService],
})
export class OrderAssignmentsModule {}

