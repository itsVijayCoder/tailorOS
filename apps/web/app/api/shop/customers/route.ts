import { NextResponse, type NextRequest } from "next/server";

import type { CustomerContactRead } from "@tailoros/schemas";

import {
  tenantDelete,
  tenantGet,
  tenantPatch,
  tenantPost,
} from "@/features/core-modules/tenant-api";

type CustomerPayload = {
  mode?: string;
  contactId?: string;
  profileId?: string;
  primaryMobile?: string;
  whatsappMobile?: string;
  whatsappOptIn?: boolean;
  notes?: string;
  fullName?: string;
  relationLabel?: string;
  genderContext?: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const params = new URLSearchParams({ limit: "12" });
  if (query.trim()) params.set("q", query.trim());

  const result = await tenantGet<{ customers: CustomerContactRead[] }>(
    `/customers/search?${params}`,
    { customers: [] },
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CustomerPayload;

  if (body.mode === "add-profile") {
    const result = await tenantPost<{ contact: CustomerContactRead }>(
      `/contacts/${required(body.contactId)}/profiles`,
      {
        createdByUserId: "usr_counter_01",
        fullName: required(body.fullName),
        genderContext: optional(body.genderContext),
        relationLabel: optional(body.relationLabel) ?? "family",
      },
      { contact: emptyContact() },
    );

    return NextResponse.json(result, { status: result.error ? 400 : 201 });
  }

  const result = await tenantPost<{ contact: CustomerContactRead }>(
    "/contacts",
    {
      createdByUserId: "usr_counter_01",
      notes: optional(body.notes),
      primaryMobile: required(body.primaryMobile),
      profiles: [
        {
          fullName: required(body.fullName),
          genderContext: optional(body.genderContext),
          relationLabel: optional(body.relationLabel) ?? "self",
        },
      ],
      whatsappMobile: optional(body.whatsappMobile),
      whatsappOptIn: Boolean(body.whatsappOptIn),
    },
    { contact: emptyContact() },
  );

  return NextResponse.json(result, { status: result.error ? 400 : 201 });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CustomerPayload;

  if (body.mode === "profile") {
    const result = await tenantPatch<{ contact: CustomerContactRead }>(
      `/profiles/${required(body.profileId)}`,
      {
        fullName: optional(body.fullName),
        genderContext: optional(body.genderContext),
        relationLabel: optional(body.relationLabel),
      },
      { contact: emptyContact() },
    );

    return NextResponse.json(result, { status: result.error ? 400 : 200 });
  }

  const result = await tenantPatch<{ contact: CustomerContactRead }>(
    `/contacts/${required(body.contactId)}`,
    {
      notes: optional(body.notes),
      primaryMobile: optional(body.primaryMobile),
      whatsappMobile: optional(body.whatsappMobile),
      whatsappOptIn: body.whatsappOptIn,
    },
    { contact: emptyContact() },
  );

  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

export async function DELETE(request: NextRequest) {
  const profileId = required(request.nextUrl.searchParams.get("profileId"));
  const result = await tenantDelete<{ contact: CustomerContactRead }>(
    `/profiles/${profileId}`,
    { contact: emptyContact() },
  );

  return NextResponse.json(result, { status: result.error ? 400 : 200 });
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

function emptyContact(): CustomerContactRead {
  return {
    address: null,
    contactId: "",
    createdAt: new Date(0).toISOString(),
    notes: null,
    primaryMobileE164: "",
    primaryMobileNational: "",
    profiles: [],
    updatedAt: new Date(0).toISOString(),
    whatsappMobileE164: null,
    whatsappOptIn: false,
  };
}
