import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AuditService } from "../common/audit.service";
import { TenantAccessService } from "../tenant/tenant-access.service";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { IdempotencyInterceptor } from "./idempotency.interceptor";
import { WebhookDispatchService } from "./webhook-dispatch.service";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";

@Module({
  imports: [AuthModule],
  controllers: [ApiKeysController, WebhooksController],
  providers: [
    ApiKeysService,
    WebhooksService,
    WebhookDispatchService,
    IdempotencyInterceptor,
    TenantAccessService,
    AuditService,
  ],
  exports: [WebhookDispatchService, IdempotencyInterceptor],
})
export class IntegrationsModule {}
