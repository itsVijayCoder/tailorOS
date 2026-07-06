"use server";

import { revalidatePath } from "next/cache";

import {
  platformTenantOnboardingRequestSchema,
  zodIssuesToFieldErrors,
} from "@tailoros/schemas";

import type { TenantOnboardingActionState } from "./action-state";
import { onboardTenant } from "./control-plane-api";

export async function onboardTenantAction(
  _prevState: TenantOnboardingActionState,
  formData: FormData,
): Promise<TenantOnboardingActionState> {
  const parsed = platformTenantOnboardingRequestSchema.safeParse({
    adminReason: optionalString(formData.get("adminReason")),
    city: requiredString(formData.get("city")),
    ownerEmail: requiredString(formData.get("ownerEmail")),
    ownerMobile: requiredString(formData.get("ownerMobile")),
    ownerName: requiredString(formData.get("ownerName")),
    plan: formData.get("plan") || "pilot",
    preferredSlug: requiredString(formData.get("preferredSlug")),
    shopName: requiredString(formData.get("shopName")),
  });

  if (!parsed.success) {
    return {
      fields: zodIssuesToFieldErrors(parsed.error.issues),
      message: "Fix the highlighted onboarding fields.",
      ownerAccess: null,
      status: "error",
    };
  }

  const result = await onboardTenant(parsed.data);

  if (result.error) {
    return {
      message: result.error,
      ownerAccess: null,
      status: "error",
    };
  }

  revalidatePath("/admin/tenants");

  return {
    message: `Tenant ${result.data.provisioning.slug} was accepted for provisioning.`,
    ownerAccess: result.data.ownerAccess,
    status: "success",
  };
}

function requiredString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
