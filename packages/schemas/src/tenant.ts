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
  "provisioning_pending",
  "db_creating",
  "db_migrating",
  "defaults_seeding",
  "worker_deploying",
  "active",
  "suspended",
  "needs_manual_review",
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
    plan: z.enum(["pilot", "starter", "growth"]).default("pilot"),
    turnstileToken: z.string().trim().min(16),
  })
  .strict();

export type TenantContext = z.infer<typeof tenantContextSchema>;
export type CreateTenantRequest = z.infer<typeof createTenantRequestSchema>;
