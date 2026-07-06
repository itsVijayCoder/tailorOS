import type { Metadata } from "next";
import {
  Camera,
  CheckCircle2,
  GitCompareArrows,
  Ruler,
  Scale,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMeasurementAction } from "@/features/core-modules/actions";
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
  const defaultProfileId = measurementVersions[0]?.id ? "" : "";

  return (
    <>
      <PageHeader
        body="Measurements are historical records, not editable notes. Every important change creates a version, keeps old order snapshots intact, and makes unit, garment, and reason visible."
        eyebrow="Measurement center"
        title="Fast capture with version safety for real tailoring work."
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
          <MetricCard
            detail="R2 signed upload path remains API-owned"
            icon={Camera}
            label="Photos"
            tone="neutral"
            value="Ready"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <DataPanel
            description="Templates come from tenant settings and keep required versus optional fields explicit."
            title="Garment templates"
          >
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

          <DataPanel
            description="This fixture shows the fields the live form must keep visible at counter speed."
            title="Capture form skeleton"
          >
            <form action={createMeasurementAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerProfileId">Customer profile ID</Label>
                <Input
                  id="customerProfileId"
                  name="customerProfileId"
                  placeholder="CUS-..."
                  defaultValue={defaultProfileId}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="garmentTypeCode">Template</Label>
                <Select
                  defaultValue={measurementTemplates[0]?.code ?? "blouse"}
                  id="garmentTypeCode"
                  name="garmentTypeCode"
                >
                  {measurementTemplates.map((template) => (
                    <option key={template.code} value={template.code}>
                      {template.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  defaultValue={measurementTemplates[0]?.label ?? "Blouse"}
                  id="displayName"
                  name="displayName"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="values">Measurements</Label>
                <Input
                  id="values"
                  name="values"
                  placeholder="chest=36,waist=31,shoulder=14.5"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Select defaultValue="inch" id="unit" name="unit">
                  <option value="inch">Inch</option>
                  <option value="cm">Centimeter</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fitNotes">Fit preference</Label>
                <Textarea id="fitNotes" name="fitNotes" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Initial capture or changed fit"
                  required
                />
              </div>
              <Button type="submit">Capture measurement</Button>
            </form>
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

        <section className="grid gap-5 lg:grid-cols-3">
          <DataPanel title="Validation rules">
            <div className="grid gap-3">
              {[
                "Template must be active for the tenant.",
                "Required fields cannot be blank.",
                "Important changes require a reason.",
                "Old order snapshots stay unchanged.",
              ].map((rule) => (
                <div
                  className="flex items-start gap-3 rounded-lg border border-hairline bg-surface p-3"
                  key={rule}
                >
                  <CheckCircle2
                    aria-hidden
                    className="mt-0.5 size-4 text-state-success"
                  />
                  <span className="text-sm leading-6 text-ink-body">
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </DataPanel>
          <DataPanel title="Photo uploader contract">
            <div className="rounded-lg border border-dashed border-hairline bg-surface p-5 text-center">
              <Camera aria-hidden className="mx-auto size-8 text-accent" />
              <h3 className="mt-3 font-display text-xl font-medium text-ink-display">
                R2 signed upload
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                The browser requests a short-lived upload URL from the tenant
                API. File size, MIME type, and object key namespace are
                validated before writing to R2.
              </p>
            </div>
          </DataPanel>
          <DataPanel title="Known pilot risk">
            <div className="rounded-lg border border-signal bg-signal-faded p-4">
              <ShieldAlert
                aria-hidden
                className="mb-3 size-5 text-signal-darker"
              />
              <p className="text-sm leading-6 text-ink-body">
                Inch and centimeter confusion is expensive. The production form
                should keep unit controls sticky in the measurement grid and log
                the unit with every version.
              </p>
            </div>
          </DataPanel>
        </section>
      </div>
    </>
  );
}
