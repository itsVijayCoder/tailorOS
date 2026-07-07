import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMeasurementAction } from "@/features/core-modules/actions";
import { PageHeader } from "@/features/core-modules/components/module-primitives";
import { readMeasurementTemplates } from "@/features/core-modules/tenant-api";

export const metadata: Metadata = {
  title: "New Measurement",
};

export const dynamic = "force-dynamic";

export default async function NewMeasurementPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const [params, templates] = await Promise.all([
    searchParams,
    readMeasurementTemplates(),
  ]);

  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href="/shop/measurements"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Measurements
          </Link>
        }
        body="Capture a new measurement version for a selected customer profile."
        eyebrow="New measurement"
        title="Capture measurement"
      />
      <div className="mx-auto grid max-w-3xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <form
          action={createMeasurementAction}
          className="grid gap-4 rounded-lg border border-hairline bg-surface-strong p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customerProfileId">Customer profile ID</Label>
              <Input
                defaultValue={params.profileId ?? ""}
                id="customerProfileId"
                name="customerProfileId"
                placeholder="Profile ID"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="garmentTypeCode">Template</Label>
              <Select
                defaultValue={templates.data.templates[0]?.code ?? "alteration"}
                id="garmentTypeCode"
                name="garmentTypeCode"
              >
                {templates.data.templates.map((template) => (
                  <option key={template.code} value={template.code}>
                    {template.displayName}
                  </option>
                ))}
                {templates.data.templates.length === 0 ? (
                  <option value="alteration">Alteration</option>
                ) : null}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Blouse"
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
            <Label htmlFor="fitNotes">Fit notes</Label>
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
      </div>
    </>
  );
}
