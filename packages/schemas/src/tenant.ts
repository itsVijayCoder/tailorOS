import { z } from "zod";

export const tenantIdSchema = z
  .string()
  .trim()
  .regex(/^ten_[a-z0-9]{12,48}$/, "Invalid tenant ID.");

export const tenantSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(48)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Tenant slug must be lowercase kebab case.",
  );

export const tenantStatusSchema = z.enum([
  "requested",
  "validating_owner",
  "tenant_reserved",
  "provisioning_pending",
  "db_creating",
  "db_migrating",
  "defaults_seeding",
  "worker_registering",
  "health_checking",
  "active",
  "suspended",
  "exporting",
  "deleting",
  "deleted",
  "failed_validation",
  "failed_db_create",
  "failed_migration",
  "failed_seed",
  "failed_worker_register",
  "needs_manual_review",
]);

export const provisioningStepSchema = z.enum([
  "requested",
  "validating_owner",
  "tenant_reserved",
  "db_creating",
  "db_migrating",
  "defaults_seeding",
  "worker_registering",
  "health_checking",
  "active",
  "failed_validation",
  "failed_db_create",
  "failed_migration",
  "failed_seed",
  "failed_worker_register",
  "needs_manual_review",
]);

export const provisioningJobStatusSchema = z.enum([
  "queued",
  "running",
  "retrying",
  "succeeded",
  "failed",
  "needs_manual_review",
  "cancelled",
]);

export const tenantPlanSchema = z.enum(["pilot", "starter", "growth"]);

export const tenantRegistryStatusSchema = z.enum([
  "pending",
  "creating",
  "created",
  "migrating",
  "seeded",
  "active",
  "failed",
  "manual_review",
  "archived",
]);

export const tenantWorkerRegistryStatusSchema = z.enum([
  "pending",
  "registering",
  "registered",
  "healthy",
  "failed",
  "manual_review",
  "disabled",
]);

export const tenantContextSchema = z
  .object({
    id: tenantIdSchema,
    slug: tenantSlugSchema,
    status: tenantStatusSchema,
    databaseName: z.string().trim().min(1).max(128),
    workerName: z.string().trim().min(1).max(128),
  })
  .strict();

export const createTenantRequestSchema = z
  .object({
    shopName: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(80),
    ownerName: z.string().trim().min(2).max(120),
    ownerMobile: z.string().trim().min(8).max(32),
    ownerEmail: z.string().trim().email(),
    preferredSlug: tenantSlugSchema,
    plan: tenantPlanSchema.default("pilot"),
    turnstileToken: z.string().trim().min(16),
  })
  .strict();

export const platformTenantOnboardingRequestSchema = createTenantRequestSchema
  .omit({ turnstileToken: true })
  .extend({
    adminReason: z
      .string()
      .trim()
      .min(3)
      .max(240)
      .default("super_admin_onboarding"),
  })
  .strict();

export const tenantProvisionQueuePayloadSchema = z
  .object({
    tenantId: tenantIdSchema,
    preferredSlug: tenantSlugSchema,
    plan: tenantPlanSchema,
  })
  .strict();

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const tenantProvisioningSummarySchema = z
  .object({
    tenantId: tenantIdSchema,
    tenantCode: z.string().trim().min(3).max(32),
    slug: tenantSlugSchema,
    businessName: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(80).nullable(),
    state: z.string().trim().min(2).max(80).nullable(),
    timezone: z.string().trim().min(2).max(80),
    status: tenantStatusSchema,
    planCode: tenantPlanSchema,
    ownerName: z.string().trim().min(2).max(120).nullable(),
    ownerEmail: z.string().trim().email().nullable(),
    ownerMobile: z.string().trim().min(8).max(32).nullable(),
    jobId: z.string().trim().min(8).max(128).nullable(),
    jobStatus: provisioningJobStatusSchema.nullable(),
    provisioningStep: provisioningStepSchema.nullable(),
    attempts: z.number().int().nonnegative(),
    lastError: z.string().trim().min(1).max(2000).nullable(),
    idempotencyKey: z.string().trim().min(12).max(160).nullable(),
    d1DatabaseName: z.string().trim().min(1).max(128).nullable(),
    d1DatabaseId: z.string().trim().min(1).max(128).nullable(),
    primaryLocationHint: z.string().trim().min(2).max(32).nullable(),
    readReplicationMode: z.string().trim().min(2).max(32).nullable(),
    schemaVersion: z.number().int().nonnegative().nullable(),
    workerName: z.string().trim().min(1).max(128).nullable(),
    workerStatus: tenantWorkerRegistryStatusSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const createTenantProvisioningResponseSchema = z
  .object({
    tenantId: tenantIdSchema,
    slug: tenantSlugSchema,
    status: tenantStatusSchema,
    queuedJobId: z.string().trim().min(8).max(128),
    provisioningUrl: z.string().trim().min(1),
    reusedExistingRequest: z.boolean(),
  })
  .strict();

export const retryTenantProvisioningResponseSchema = z
  .object({
    tenantId: tenantIdSchema,
    status: tenantStatusSchema,
    queuedJobId: z.string().trim().min(8).max(128),
    provisioningStep: provisioningStepSchema,
  })
  .strict();

export const ownerAccessSetupSchema = z
  .object({
    userId: z.string().trim().min(6).max(128),
    membershipId: z.string().trim().min(6).max(128),
    sessionId: z.string().trim().min(6).max(128),
    role: z.literal("owner"),
    email: z.string().trim().email(),
    sessionToken: z.string().trim().min(24).max(256),
    expiresAt: isoDateTimeSchema,
    loginHint: z.string().trim().min(1).max(240),
    tenantApiPath: z.string().trim().min(1).max(240),
  })
  .strict();

export const platformTenantOnboardingResponseSchema = z
  .object({
    provisioning: createTenantProvisioningResponseSchema,
    ownerAccess: ownerAccessSetupSchema,
  })
  .strict();

export type TenantContext = z.infer<typeof tenantContextSchema>;
export type CreateTenantRequest = z.infer<typeof createTenantRequestSchema>;
export type PlatformTenantOnboardingRequest = z.infer<
  typeof platformTenantOnboardingRequestSchema
>;
export type TenantStatus = z.infer<typeof tenantStatusSchema>;
export type ProvisioningStep = z.infer<typeof provisioningStepSchema>;
export type ProvisioningJobStatus = z.infer<typeof provisioningJobStatusSchema>;
export type TenantPlan = z.infer<typeof tenantPlanSchema>;
export type TenantProvisionQueuePayload = z.infer<
  typeof tenantProvisionQueuePayloadSchema
>;
export type TenantProvisioningSummary = z.infer<
  typeof tenantProvisioningSummarySchema
>;
export type CreateTenantProvisioningResponse = z.infer<
  typeof createTenantProvisioningResponseSchema
>;
export type RetryTenantProvisioningResponse = z.infer<
  typeof retryTenantProvisioningResponseSchema
>;
export type OwnerAccessSetup = z.infer<typeof ownerAccessSetupSchema>;
export type PlatformTenantOnboardingResponse = z.infer<
  typeof platformTenantOnboardingResponseSchema
>;
