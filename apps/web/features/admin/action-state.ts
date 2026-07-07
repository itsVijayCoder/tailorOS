import type { OwnerAccessSetup } from "@tailoros/schemas";

export type TenantOnboardingActionState = {
  fields?: Record<string, string[]>;
  message: string;
  ownerAccess: OwnerAccessSetup | null;
  status: "idle" | "success" | "error";
};

export const initialTenantOnboardingState: TenantOnboardingActionState = {
  message: "",
  ownerAccess: null,
  status: "idle",
};
