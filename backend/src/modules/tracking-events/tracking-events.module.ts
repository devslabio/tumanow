import { Module } from '@nestjs/common';
import { TrackingEventsService } from './tracking-events.service';
import { TrackingEventsController } from './tracking-events.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TrackingEventsController],
  providers: [TrackingEventsService],
  exports: [TrackingEventsService],
})
export class TrackingEventsModule {}

