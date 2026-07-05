import type { Metadata } from "next";

import { TailorOSLanding } from "@/app/_components/tailoros-landing";

export const metadata: Metadata = {
  title: "TailorOS Premium Platform",
  description:
    "Premium design-system and motion foundation for TailorOS, the modern tailor-shop operating platform.",
};

export default function Home() {
  return <TailorOSLanding />;
}
