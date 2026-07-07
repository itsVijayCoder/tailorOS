import type { Metadata } from "next";

import { CoreModulesShell } from "@/features/core-modules/components/core-modules-shell";

export const metadata: Metadata = {
  title: "TailorOS Shop OS",
  description:
    "TailorOS pilot-ready shop operating system modules for core workflows and WhatsApp connector operations.",
};

export const dynamic = "force-dynamic";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <CoreModulesShell>{children}</CoreModulesShell>;
}
