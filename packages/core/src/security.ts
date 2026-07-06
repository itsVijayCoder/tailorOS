export const tailorOsRoles = [
  "owner",
  "manager",
  "counter_staff",
  "measurement_taker",
  "tailor",
  "cutter",
  "cashier",
  "viewer",
  "platform_support",
] as const;

export type TailorOsRole = (typeof tailorOsRoles)[number];

export const securityPermissions = [
  "dashboard.read",
  "customers.read",
  "customers.write",
  "measurements.read",
  "measurements.write",
  "orders.read",
  "orders.write",
  "production.update",
  "payments.record",
  "payments.correct",
  "reports.read",
  "exports.create",
  "settings.manage",
  "staff.manage",
  "billing.manage",
  "integrations.manage",
  "credentials.health.read",
  "credentials.rotate",
  "credentials.raw.read",
  "receipts.issue_link",
  "privacy.export",
  "privacy.delete",
  "audit.read",
  "tenant.delete",
  "support.tenant_access",
  "support.unscoped_access",
] as const;

export type SecurityPermission = (typeof securityPermissions)[number];

export type TenantStatusForAuthorization =
  "active" | "provisioning" | "suspended" | "disabled" | "deleting";

export type SupportAccessGrant = Readonly<{
  tenantId: string;
  reason: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
}>;

export type TenantAuthorizationInput = Readonly<{
  role: TailorOsRole;
  permission: SecurityPermission;
  tenantId: string;
  membershipTenantId: string | null;
  tenantStatus: TenantStatusForAuthorization;
  now?: Date;
  supportGrant?: SupportAccessGrant | null;
}>;

export type TenantAuthorizationDecision =
  | Readonly<{
      allowed: true;
      reason: "ALLOWED";
    }>
  | Readonly<{
      allowed: false;
      reason:
        | "TENANT_NOT_ACTIVE"
        | "TENANT_MEMBERSHIP_MISMATCH"
        | "SUPPORT_SCOPE_REQUIRED"
        | "SUPPORT_REASON_REQUIRED"
        | "SUPPORT_SCOPE_EXPIRED"
        | "ROLE_FORBIDDEN";
    }>;

const ownerPermissions = securityPermissions.filter(
  (permission) =>
    permission !== "credentials.raw.read" &&
    permission !== "support.unscoped_access",
);

export const rolePermissionMatrix = {
  owner: ownerPermissions,
  manager: [
    "dashboard.read",
    "customers.read",
    "customers.write",
    "measurements.read",
    "measurements.write",
    "orders.read",
    "orders.write",
    "production.update",
    "payments.record",
    "payments.correct",
    "reports.read",
    "exports.create",
    "settings.manage",
    "integrations.manage",
    "credentials.health.read",
    "receipts.issue_link",
    "privacy.export",
    "audit.read",
  ],
  counter_staff: [
    "dashboard.read",
    "customers.read",
    "customers.write",
    "measurements.read",
    "orders.read",
    "orders.write",
    "payments.record",
    "receipts.issue_link",
  ],
  measurement_taker: [
    "dashboard.read",
    "customers.read",
    "measurements.read",
    "measurements.write",
    "orders.read",
  ],
  tailor: [
    "dashboard.read",
    "measurements.read",
    "orders.read",
    "production.update",
  ],
  cutter: [
    "dashboard.read",
    "measurements.read",
    "orders.read",
    "production.update",
  ],
  cashier: [
    "dashboard.read",
    "customers.read",
    "orders.read",
    "payments.record",
    "receipts.issue_link",
    "reports.read",
  ],
  viewer: ["dashboard.read", "customers.read", "orders.read"],
  platform_support: [
    "dashboard.read",
    "customers.read",
    "measurements.read",
    "orders.read",
    "reports.read",
    "credentials.health.read",
    "audit.read",
    "support.tenant_access",
  ],
} as const satisfies Record<TailorOsRole, readonly SecurityPermission[]>;

export const sensitiveAuditActions = [
  "measurement.edit",
  "payment.correct",
  "payment.refund",
  "order.cancel",
  "receipt.delete",
  "export.create",
  "privacy.delete",
  "credential.create",
  "credential.rotate",
  "credential.disable",
  "support.access.start",
  "support.access.end",
] as const;

export type SensitiveAuditAction = (typeof sensitiveAuditActions)[number];

export function getRolePermissions(role: TailorOsRole) {
  return rolePermissionMatrix[role];
}

export function canRoleAccess(
  role: TailorOsRole,
  permission: SecurityPermission,
) {
  return (rolePermissionMatrix[role] as readonly SecurityPermission[]).includes(
    permission,
  );
}

export function getDeniedPermissionsForRole(
  role: TailorOsRole,
  permissions: readonly SecurityPermission[],
) {
  return permissions.filter((permission) => !canRoleAccess(role, permission));
}

export function authorizeTenantPermission(
  input: TenantAuthorizationInput,
): TenantAuthorizationDecision {
  if (input.tenantStatus !== "active") {
    return { allowed: false, reason: "TENANT_NOT_ACTIVE" };
  }

  if (input.membershipTenantId !== input.tenantId) {
    return { allowed: false, reason: "TENANT_MEMBERSHIP_MISMATCH" };
  }

  if (input.role === "platform_support") {
    const supportDecision = authorizeSupportScope(input);
    if (!supportDecision.allowed) {
      return supportDecision;
    }
  }

  if (!canRoleAccess(input.role, input.permission)) {
    return { allowed: false, reason: "ROLE_FORBIDDEN" };
  }

  return { allowed: true, reason: "ALLOWED" };
}

export function requiresSecurityAudit(action: SensitiveAuditAction | string) {
  return sensitiveAuditActions.includes(action as SensitiveAuditAction);
}

export function maskSensitiveIdentifier(input: string, visibleSuffix = 4) {
  const value = input.trim();

  if (value.length === 0) {
    return "";
  }

  if (visibleSuffix <= 0) {
    return "*".repeat(value.length);
  }

  const suffix = value.slice(-visibleSuffix);
  const maskLength = Math.max(4, value.length - suffix.length);

  return `${"*".repeat(maskLength)}${suffix}`;
}

export function createCredentialPublicView(input: {
  businessId: string;
  phoneNumberId: string;
  tokenStatus: "valid" | "invalid" | "expired" | "permission_issue";
  tokenLastRotatedAt: string;
  tokenRotationDueAt: string;
}) {
  return {
    businessId: maskSensitiveIdentifier(input.businessId),
    phoneNumberId: maskSensitiveIdentifier(input.phoneNumberId),
    tokenLastRotatedAt: input.tokenLastRotatedAt,
    tokenRotationDueAt: input.tokenRotationDueAt,
    tokenStatus: input.tokenStatus,
  };
}

export function evaluateSignedAccess(input: {
  expiresAt: string;
  now?: Date;
  signatureValid: boolean;
  confirmationRequired?: boolean;
  confirmationSatisfied?: boolean;
}) {
  if (!input.signatureValid) {
    return {
      allowed: false,
      reason: "INVALID_SIGNATURE",
    } as const;
  }

  const nowMs = (input.now ?? new Date()).getTime();
  const expiresAtMs = new Date(input.expiresAt).getTime();

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
    return {
      allowed: false,
      reason: "EXPIRED",
    } as const;
  }

  if (input.confirmationRequired && !input.confirmationSatisfied) {
    return {
      allowed: false,
      reason: "CONFIRMATION_REQUIRED",
    } as const;
  }

  return {
    allowed: true,
    reason: "ALLOWED",
  } as const;
}

function authorizeSupportScope(
  input: TenantAuthorizationInput,
): TenantAuthorizationDecision {
  const grant = input.supportGrant;

  if (
    !grant ||
    grant.status !== "active" ||
    grant.tenantId !== input.tenantId
  ) {
    return { allowed: false, reason: "SUPPORT_SCOPE_REQUIRED" };
  }

  if (grant.reason.trim().length < 8) {
    return { allowed: false, reason: "SUPPORT_REASON_REQUIRED" };
  }

  const nowMs = (input.now ?? new Date()).getTime();
  const expiresAtMs = new Date(grant.expiresAt).getTime();

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
    return { allowed: false, reason: "SUPPORT_SCOPE_EXPIRED" };
  }

  return { allowed: true, reason: "ALLOWED" };
}
