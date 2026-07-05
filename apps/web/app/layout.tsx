import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClientProviders } from "@/components/motion/client-providers";

const headingFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const interfaceFont = Inter({
  variable: "--font-interface",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TailorOS | Premium Tailor-Shop Operating System",
    template: "%s | TailorOS",
  },
  description:
    "A premium operating platform for tailor shops, unifying orders, measurements, fittings, WhatsApp conversations, and delivery workflows.",
};

const themeBootScript = `
(() => {
  try {
    const stored = localStorage.getItem("bm-ds-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = stored === "light" ? false : stored === "system" ? systemDark : true;
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
      className={cn(
        "h-full font-sans antialiased",
        bodyFont.variable,
        headingFont.variable,
        interfaceFont.variable,
      )}
    >
      <head>
        {/* bm-design-system:start */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {/* bm-design-system:end */}
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
