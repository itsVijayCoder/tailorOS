import {
  authorizeTenantPermission,
  type SecurityPermission,
  type TailorOsRole,
  type TenantStatusForAuthorization,
} from "@tailoros/core";

import type { ResolvedTenantDispatch } from "./tenant-resolution";

export type TenantSessionContext = {
  userId: string;
  displayName: string;
  email: string;
  role: TailorOsRole;
  membershipId: string;
  membershipTenantId: string;
};

type SessionRow = {
  userId: string;
  displayName: string;
  email: string;
  userStatus: string;
  sessionStatus: string;
  sessionExpiresAt: string;
  membershipId: string;
  membershipTenantId: string;
  membershipStatus: string;
  role: TailorOsRole;
};

export function extractBearerToken(input: {
  authorization?: string | null;
  cookie?: string | null;
}) {
  const authorization = input.authorization?.trim();

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  const cookieToken = input.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("tailoros_session="));

  return cookieToken
    ? decodeURIComponent(cookieToken.slice("tailoros_session=".length))
    : null;
}

export async function resolveTenantSession(input: {
  db: D1Database;
  tenantId: string;
  token: string;
  now?: Date;
}): Promise<TenantSessionContext | null> {
  const tokenHash = await sha256Hex(input.token);
  const row = await input.db
    .prepare(
      `SELECT
        u.id AS userId,
        u.display_name AS displayName,
        u.email AS email,
        u.status AS userStatus,
        s.status AS sessionStatus,
        s.expires_at AS sessionExpiresAt,
        m.id AS membershipId,
        m.tenant_id AS membershipTenantId,
        m.status AS membershipStatus,
        m.role AS role
      FROM staff_sessions s
      INNER JOIN users u ON u.id = s.user_id
      INNER JOIN memberships m ON m.user_id = u.id
      WHERE s.session_token_hash = ?
        AND m.tenant_id = ?
      LIMIT 1`,
    )
    .bind(tokenHash, input.tenantId)
    .first<SessionRow>();

  if (!row) {
    return null;
  }

  const nowMs = (input.now ?? new Date()).getTime();
  const expiresAtMs = new Date(row.sessionExpiresAt).getTime();

  if (
    row.userStatus !== "active" ||
    row.sessionStatus !== "active" ||
    row.membershipStatus !== "active" ||
    !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= nowMs
  ) {
    return null;
  }

  return {
    userId: row.userId,
    displayName: row.displayName,
    email: row.email,
    role: row.role,
    membershipId: row.membershipId,
    membershipTenantId: row.membershipTenantId,
  };
}

export function authorizeGatewayTenantRequest(input: {
  tenant: ResolvedTenantDispatch;
  session: TenantSessionContext;
  permission: SecurityPermission;
}) {
  return authorizeTenantPermission({
    role: input.session.role,
    permission: input.permission,
    tenantId: input.tenant.tenantId,
    membershipTenantId: input.session.membershipTenantId,
    tenantStatus: mapTenantStatus(input.tenant.status),
  });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function mapTenantStatus(
  status: ResolvedTenantDispatch["status"],
): TenantStatusForAuthorization {
  if (status === "active") {
    return "active";
  }

  if (status === "suspended") {
    return "suspended";
  }

  if (status === "deleting" || status === "deleted") {
    return "deleting";
  }

  return "provisioning";
}
