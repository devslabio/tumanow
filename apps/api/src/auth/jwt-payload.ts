export type TumaNowJwtPayload = {
  sub: string;
  email: string;
  platformRoleKeys: string[];
  permissionCodes: string[];
  roleKey?: string;
  roleName?: string;
  operatorId?: string;
  membershipId?: string;
  operatorName?: string;
  accessScope?: "ALL_BRANCHES" | "SELECTED";
  branchIds?: string[];
  customerId?: string;
  isCustomer?: boolean;
  driverId?: string;
  /** Bumped on logout / password reset / deactivation to revoke outstanding tokens. */
  tokenVersion?: number;
};
