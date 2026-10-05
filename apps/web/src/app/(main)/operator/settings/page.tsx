"use client";

import Link from "next/link";
import { Car, MapPin, MapPinned, PackageOpen, Tags, Truck } from "lucide-react";

import { Card, PageHeader } from "@/components/ui/primitives";
import { hasPermission } from "@/lib/api";
import { useClientSession } from "@/lib/use-client-session";

const LINKS = [
  {
    href: "/operator/package-types",
    title: "Package types",
    description: "Parcel categories used for matching and pricing.",
    icon: PackageOpen,
    permission: "package_type.view",
  },
  {
    href: "/operator/coverage",
    title: "Coverage",
    description: "Cities and zones this operator can serve.",
    icon: MapPinned,
    permission: "coverage.view",
  },
  {
    href: "/operator/pricing",
    title: "Pricing",
    description: "Base fees, distance, and surcharge rules.",
    icon: Tags,
    permission: "pricing.view",
  },
  {
    href: "/operator/drivers",
    title: "Drivers",
    description: "Riders and driver availability.",
    icon: Truck,
    permission: "drivers.view",
  },
  {
    href: "/operator/vehicles",
    title: "Fleet",
    description: "Vehicles assigned to drivers and shipments.",
    icon: Car,
    permission: "fleet.view",
  },
  {
    href: "/operator/branches",
    title: "Branches",
    description: "Physical locations for this operator.",
    icon: MapPin,
    permission: "branch.view",
  },
] as const;

export default function OperatorSettingsPage() {
  const session = useClientSession();
  const links = LINKS.filter((item) =>
    hasPermission(session, item.permission),
  );

  return (
    <div>
      <PageHeader
        title="Operator settings"
        subtitle="Configure fleet, branches, and capabilities that power matching."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="h-full transition-colors group-hover:border-[var(--tn-primary)]">
                <div className="flex items-start gap-3">
                  <span className="rounded-[var(--radius-field)] bg-[var(--tn-field-bg)] p-2 text-[var(--tn-primary)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--tn-muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {links.length === 0 ? (
        <Card className="mt-4 text-sm text-[var(--tn-muted)]">
          You do not have permission to view configuration pages.
        </Card>
      ) : null}
    </div>
  );
}
