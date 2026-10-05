import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AuditService } from "../common/audit.service";
import { TenantAccessService } from "../tenant/tenant-access.service";
import {
  CustomerCorporateAccountsController,
  TenantCorporateAccountsController,
} from "./corporate-accounts.controller";
import { CorporateAccountsService } from "./corporate-accounts.service";
import { CustomerInvoicesController, TenantInvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { TeamController } from "./team.controller";
import { TeamService } from "./team.service";

@Module({
  imports: [AuthModule],
  controllers: [
    TenantCorporateAccountsController,
    CustomerCorporateAccountsController,
    TenantInvoicesController,
    CustomerInvoicesController,
    TeamController,
  ],
  providers: [
    CorporateAccountsService,
    InvoicesService,
    TeamService,
    TenantAccessService,
    AuditService,
  ],
  exports: [CorporateAccountsService],
})
export class CorporateModule {}
