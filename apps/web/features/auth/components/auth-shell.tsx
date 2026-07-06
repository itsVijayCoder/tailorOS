import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, LockKeyhole, ScissorsLineDashed } from "lucide-react";

export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-page text-ink-body">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_18%,var(--ambient-primary),transparent_28rem),radial-gradient(circle_at_88%_18%,var(--ambient-accent),transparent_24rem),linear-gradient(135deg,var(--surface-strong),var(--page))]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(var(--hairline)_1px,transparent_1px),linear-gradient(90deg,var(--hairline)_1px,transparent_1px)] [background-size:42px_42px]"
      />
      <section className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="relative isolate flex min-h-[42dvh] flex-col justify-between overflow-hidden bg-[color-mix(in_oklch,var(--ink-display)_72%,var(--state-info))] px-5 py-5 text-[var(--surface-strong)] sm:px-8 lg:min-h-dvh lg:px-10 lg:py-8">
          <div
            aria-hidden
            className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_16%_12%,color-mix(in_oklch,var(--state-info)_34%,transparent),transparent_25rem),radial-gradient(circle_at_80%_20%,color-mix(in_oklch,var(--state-success)_28%,transparent),transparent_28rem),radial-gradient(circle_at_72%_86%,color-mix(in_oklch,var(--signal)_18%,transparent),transparent_22rem),linear-gradient(150deg,color-mix(in_oklch,var(--ink-display)_72%,var(--state-info)),color-mix(in_oklch,var(--ink-display)_66%,var(--state-success)))]"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(color-mix(in_oklch,var(--surface)_18%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--surface)_18%,transparent)_1px,transparent_1px)] [background-size:38px_38px]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-[linear-gradient(0deg,color-mix(in_oklch,var(--accent)_20%,transparent),transparent)]"
          />
          <Link className="group flex w-fit items-center gap-3" href="/">
            <span className="grid size-11 place-items-center rounded-lg border border-accent bg-accent text-accent-foreground shadow-token transition duration-200 ease-premium group-hover:-rotate-2 group-hover:scale-105 motion-reduce:transition-none">
              <ScissorsLineDashed aria-hidden className="size-5" />
            </span>
            <span className="leading-tight">
              <strong className="block font-display text-xl font-medium text-[var(--surface-strong)]">
                TailorOS
              </strong>
              <span className="block text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklch,var(--surface-strong)_68%,transparent)]">
                Shop operating desk
              </span>
            </span>
          </Link>

          <div className="max-w-3xl py-10 lg:py-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--surface)_18%,transparent)] bg-[color-mix(in_oklch,var(--surface)_10%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color-mix(in_oklch,var(--surface-strong)_74%,transparent)] shadow-sm backdrop-blur">
              <LockKeyhole aria-hidden className="size-3.5 text-signal" />
              {eyebrow}
            </div>
            <h1 className="max-w-3xl text-balance font-display text-5xl font-medium leading-[0.92] text-[var(--surface-strong)] sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[color-mix(in_oklch,var(--surface-strong)_76%,transparent)] sm:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="hidden max-w-3xl gap-3 text-sm text-[color-mix(in_oklch,var(--surface-strong)_70%,transparent)] lg:grid lg:grid-cols-3">
            {[
              "Tenant-isolated sessions",
              "Owner-controlled recovery",
              "Gateway-compatible cookies",
            ].map((item) => (
              <div
                className="flex items-center gap-2 rounded-lg border border-[color-mix(in_oklch,var(--surface)_14%,transparent)] bg-[color-mix(in_oklch,var(--surface)_9%,transparent)] px-3 py-2 shadow-sm backdrop-blur"
                key={item}
              >
                <BadgeCheck aria-hidden className="size-4 text-signal" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center border-t border-hairline bg-[color-mix(in_oklch,var(--surface-strong)_88%,transparent)] px-5 py-8 shadow-lift backdrop-blur-xl sm:px-8 lg:border-l lg:border-t-0 lg:px-8">
          <div className="w-full">{children}</div>
        </div>
      </section>
    </main>
  );
}
