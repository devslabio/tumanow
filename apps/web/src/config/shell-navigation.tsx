"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Car,
  ClipboardList,
  FileText,
  HandCoins,
  KeyRound,
  Landmark,
  LayoutDashboard,
  MapPinned,
  MapPin,
  Package,
  PackageOpen,
  Receipt,
  RotateCcw,
  Search,
  Settings2,
  Tags,
  Truck,
  UserRound,
  Users,
  Wallet,
  Webhook,
} from "lucide-react";

import { hasPermission, type SessionSnapshot } from "@/lib/api";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPermission?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const APP_NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/notifications", label: "Alerts", icon: Bell },
      { href: "/profile", label: "Profile", icon: UserRound },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        href: "/platform/dashboard",
        label: "Platform home",
        icon: LayoutDashboard,
        requiredPermission: "platform.dashboard.view",
      },
      {
        href: "/platform/operators",
        label: "Operators",
        icon: Building2,
        requiredPermission: "platform.operator.view",
      },
      {
        href: "/platform/audit",
        label: "Audit",
        icon: ClipboardList,
        requiredPermission: "platform.audit.view",
      },
      {
        href: "/platform/settlements",
        label: "Settlements",
        icon: Landmark,
        requiredPermission: "platform.settlements.manage",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/operator/dashboard",
        label: "Ops home",
        icon: LayoutDashboard,
        requiredPermission: "reports.view",
      },
      {
        href: "/operator/shipments",
        label: "Shipments",
        icon: Package,
        requiredPermission: "orders.view",
      },
      {
        href: "/operator/payments",
        label: "Payments",
        icon: Wallet,
        requiredPermission: "payments.view",
      },
      {
        href: "/operator/quotations",
        label: "Quotations",
        icon: FileText,
        requiredPermission: "orders.view",
      },
      {
        href: "/operator/returns",
        label: "Returns",
        icon: RotateCcw,
        requiredPermission: "orders.view",
      },
      {
        href: "/operator/drivers",
        label: "Drivers",
        icon: Truck,
        requiredPermission: "drivers.view",
      },
      {
        href: "/operator/vehicles",
        label: "Fleet",
        icon: Car,
        requiredPermission: "fleet.view",
      },
      {
        href: "/operator/branches",
        label: "Branches",
        icon: MapPin,
        requiredPermission: "branch.view",
      },
      {
        href: "/operator/package-types",
        label: "Package types",
        icon: PackageOpen,
        requiredPermission: "package_type.view",
      },
      {
        href: "/operator/coverage",
        label: "Coverage",
        icon: MapPinned,
        requiredPermission: "coverage.view",
      },
      {
        href: "/operator/pricing",
        label: "Pricing",
        icon: Tags,
        requiredPermission: "pricing.view",
      },
      {
        href: "/operator/corporate-accounts",
        label: "Corporate accounts",
        icon: HandCoins,
        requiredPermission: "corporate.manage",
      },
      {
        href: "/operator/invoices",
        label: "Invoices",
        icon: Receipt,
        requiredPermission: "corporate.manage",
      },
      {
        href: "/operator/settlements",
        label: "Settlements",
        icon: Landmark,
        requiredPermission: "settlements.view",
      },
      {
        href: "/operator/api-keys",
        label: "API keys",
        icon: KeyRound,
        requiredPermission: "integrations.manage",
      },
      {
        href: "/operator/webhooks",
        label: "Webhooks",
        icon: Webhook,
        requiredPermission: "integrations.manage",
      },
      {
        href: "/operator/audit",
        label: "Audit",
        icon: ClipboardList,
        requiredPermission: "audit.view",
      },
      {
        href: "/operator/settings",
        label: "Settings",
        icon: Settings2,
        requiredPermission: "operator.settings.view",
      },
    ],
  },
  {
    title: "Customer",
    items: [
      {
        href: "/customer/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        requiredPermission: "customer.shipments.view",
      },
      {
        href: "/customer/shipments",
        label: "My shipments",
        icon: Package,
        requiredPermission: "customer.shipments.view",
      },
      {
        href: "/customer/new-shipment",
        label: "New shipment",
        icon: Truck,
        requiredPermission: "customer.shipments.create",
      },
      {
        href: "/customer/quotations",
        label: "Quotations",
        icon: FileText,
        requiredPermission: "customer.shipments.view",
      },
      {
        href: "/customer/returns",
        label: "Returns",
        icon: RotateCcw,
        requiredPermission: "customer.shipments.view",
      },
      {
        href: "/customer/corporate-account",
        label: "Corporate account",
        icon: HandCoins,
        requiredPermission: "customer.shipments.view",
      },
      {
        href: "/customer/invoices",
        label: "Invoices",
        icon: Receipt,
        requiredPermission: "customer.shipments.view",
      },
      {
        href: "/customer/team",
        label: "Team",
        icon: Users,
        requiredPermission: "customer.team.manage",
      },
    ],
  },
  {
    title: "Public",
    items: [{ href: "/track", label: "Track shipment", icon: Search }],
  },
];

export function filterNav(
  groups: NavGroup[],
  session: SessionSnapshot | null | undefined,
) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.requiredPermission ||
          hasPermission(session, item.requiredPermission),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
