import type { Metadata } from "next";
import Link from "next/link";
import {
  GitCompareArrows,
  Plus,
  Ruler,
  Scale,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getRealMeasurementsData } from "@/features/core-modules/real-data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";

export const metadata: Metadata = {
  title: "Measurement Center",
};

export default async function MeasurementsPage() {
  const { measurementTemplates, measurementVersions } =
    await getRealMeasurementsData();

  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/shop/measurements/new"
          >
            <Plus aria-hidden className="size-4" />
            New measurement
          </Link>
        }
        body="Measurements are historical records, not editable notes. Every important change creates a version, keeps old order snapshots intact, and makes unit, garment, and reason visible."
        eyebrow="Measurement center"
        title="Measurements"
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Active tenant-owned garment templates"
            icon={Ruler}
            label="Templates"
            tone="accent"
            value={`${measurementTemplates.length}`}
          />
          <MetricCard
            detail="Reason and actor captured on change"
            icon={GitCompareArrows}
            label="Version diffs"
            tone="success"
            value={`${measurementVersions.length}`}
          />
          <MetricCard
            detail="Inch or cm visible on every grid"
            icon={Scale}
            label="Unit clarity"
            tone="warning"
            value="Required"
          />
        </section>

        <section>
          <DataPanel title="Garment templates">
            <div className="grid gap-3 md:grid-cols-2">
              {measurementTemplates.map((template) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none"
                  key={template.code}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-medium text-ink-display">
                        {template.label}
                      </h2>
                      <p className="mt-1 text-sm text-ink-muted">
                        {template.version} · {template.defaultDays} day default
                      </p>
                    </div>
                    <Badge variant="signal">
                      {template.requiredFields.length} req
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Required
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {template.requiredFields.map((field) => (
                          <StatusBadge key={field} tone="accent">
                            {field}
                          </StatusBadge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Optional
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">
                        {template.optionalFields.join(", ")}
                      </p>
                    </div>
                    <p className="rounded-lg border border-hairline bg-page p-3 text-sm leading-6 text-ink-body">
                      {template.rangeHint}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section>
          <SectionHeader
            body="A version diff is mandatory when a measurement changes after prior orders exist."
            eyebrow="Audit safety"
            title="Version changes"
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {measurementVersions.map((version) => (
              <DataPanel
                description={`${version.customerCode} · ${version.garment} · ${version.unit}`}
                key={version.id}
                title={`${version.garment} v${version.versionNo}`}
              >
                <div className="grid gap-4">
                  <div className="rounded-lg border border-hairline bg-surface p-3">
                    <p className="text-sm leading-6 text-ink-body">
                      {version.reason}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {version.changedBy} ·{" "}
                      {new Date(version.changedAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {version.changedFields.map((field) => (
                      <div
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm"
                        key={field.label}
                      >
                        <span>
                          <strong className="block text-ink-display">
                            {field.label}
                          </strong>
                          <span className="text-ink-muted">{field.from}</span>
                        </span>
                        <GitCompareArrows
                          aria-hidden
                          className="size-4 text-accent"
                        />
                        <span className="text-right">
                          <strong className="block text-ink-display">
                            New
                          </strong>
                          <span className="text-ink-muted">{field.to}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </DataPanel>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
