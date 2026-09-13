"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Car,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MapPinned,
  MapPin,
  Package,
  PackageOpen,
  RotateCcw,
  Search,
  Settings2,
  Tags,
  Truck,
  UserRound,
  Wallet,
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
