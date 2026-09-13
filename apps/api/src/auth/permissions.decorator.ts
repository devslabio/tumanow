import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";
export const ANY_PERMISSIONS_KEY = "any_permissions";

export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);

export const RequireAnyPermission = (...codes: string[]) =>
  SetMetadata(ANY_PERMISSIONS_KEY, codes);
