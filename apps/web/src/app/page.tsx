import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "TumaNow — Multi-company courier & delivery",
  description:
    "Shared logistics infrastructure for Rwanda. Partner fleets, live tracking, and one shipment lifecycle for every operator.",
};

export default function HomePage() {
  return <LandingPage />;
}
