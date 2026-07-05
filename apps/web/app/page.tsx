import type { Metadata } from "next";

import { Phase00Dashboard } from "@/app/_components/phase00-dashboard";

export const metadata: Metadata = {
  title: "TailorOS Phase00 Master Index",
  description:
    "Phase-wise implementation command center for TailorOS and the WhatsApp Chat Connector.",
};

export default function Home() {
  return <Phase00Dashboard />;
}
