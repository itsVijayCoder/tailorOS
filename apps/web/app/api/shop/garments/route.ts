import { NextResponse, type NextRequest } from "next/server";

import type { MeasurementTemplateRead } from "@tailoros/schemas";

import {
  tenantDelete,
  tenantGet,
  tenantPatch,
  tenantPost,
} from "@/features/core-modules/tenant-api";

type GarmentPayload = {
  code?: string;
  defaultExpectedDays?: number;
  defaultPricePaise?: number;
  displayName?: string;
  fields?: string;
  isActive?: boolean;
};

export async function GET() {
  const result = await tenantGet<{ templates: MeasurementTemplateRead[] }>(
    "/measurements/templates",
    { templates: [] },
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as GarmentPayload;
  const result = await tenantPost<{ template: MeasurementTemplateRead }>(
    "/measurements/templates",
    toTenantTemplatePayload(body),
    { template: emptyTemplate() },
  );

  return NextResponse.json(result, { status: result.error ? 400 : 201 });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as GarmentPayload;
  const result = await tenantPatch<{ template: MeasurementTemplateRead }>(
    `/measurements/templates/${required(body.code)}`,
    toTenantTemplatePayload(body),
    { template: emptyTemplate() },
  );

  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

export async function DELETE(request: NextRequest) {
  const code = required(request.nextUrl.searchParams.get("code"));
  const result = await tenantDelete<{ template: MeasurementTemplateRead }>(
    `/measurements/templates/${code}`,
    { template: emptyTemplate() },
  );

  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

function toTenantTemplatePayload(body: GarmentPayload) {
  const fields = String(body.fields ?? "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  return {
    code: optional(body.code),
    defaultExpectedDays: Number(body.defaultExpectedDays ?? 7),
    defaultPricePaise: Number(body.defaultPricePaise ?? 0),
    displayName: required(body.displayName),
    isActive: body.isActive ?? true,
    measurementSchema: {
      fieldOrder: fields,
      fields: Object.fromEntries(
        fields.map((field) => [
          field,
          {
            label: field
              .split("_")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" "),
            required: true,
          },
        ]),
      ),
    },
  };
}

function required(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error("Required field is missing.");
  return text;
}

function optional(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function emptyTemplate(): MeasurementTemplateRead {
  return {
    code: "",
    defaultExpectedDays: 0,
    defaultPricePaise: 0,
    displayName: "",
    isActive: false,
    measurementSchema: {},
    updatedAt: new Date(0).toISOString(),
  };
}
