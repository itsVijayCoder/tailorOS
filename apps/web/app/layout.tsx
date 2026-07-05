import type { Metadata } from "next";
import { DM_Sans, Inter, Noto_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TailorOS Phase-wise Implementation Master Index",
    template: "%s | TailorOS",
  },
  description:
    "Premium implementation command center for TailorOS and the WhatsApp Chat Connector.",
};

const themeBootScript = `
(() => {
  try {
    const stored = localStorage.getItem("bm-ds-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = stored === "dark" || (!stored || stored === "system") && systemDark;
    document.documentElement.classList.toggle("dark", shouldUseDark);
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "scroll-smooth", "antialiased", inter.variable, dmSans.variable, "font-sans", notoSans.variable, playfairDisplayHeading.variable)}
    >
      <head>
        {/* bm-design-system:start */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {/* bm-design-system:end */}
      </head>
      <body className="min-h-full bg-page font-sans text-ink-body">
        {children}
      </body>
    </html>
  );
}
