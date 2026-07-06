import type { Metadata } from "next";

import { CoreModulesShell } from "@/features/core-modules/components/core-modules-shell";

export const metadata: Metadata = {
  title: "Phase 05 Core Modules",
  description:
    "TailorOS pilot-ready shop operating system modules for dashboard, customers, measurements, orders, production, payments, reports, and settings.",
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <CoreModulesShell>{children}</CoreModulesShell>;
}
