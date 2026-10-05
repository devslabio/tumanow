import { Module } from "@nestjs/common";

import { AuditService } from "../common/audit.service";
import { IntegrationsModule } from "../integrations/integrations.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { RiderController } from "./rider.controller";
import { RiderService } from "./rider.service";

@Module({
  imports: [NotificationsModule, IntegrationsModule],
  controllers: [RiderController],
  providers: [RiderService, AuditService],
})
export class RiderModule {}
