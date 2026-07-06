import { describe, expect, it } from "vitest";

import {
  authorizeTenantPermission,
  canRoleAccess,
  createCredentialPublicView,
  evaluateSignedAccess,
  getDeniedPermissionsForRole,
  maskSensitiveIdentifier,
  requiresSecurityAudit,
} from "./security";

describe("TailorOS security and RBAC utilities", () => {
  it("blocks cross-tenant access even when the role has the permission", () => {
    expect(
      authorizeTenantPermission({
        membershipTenantId: "ten_cbe",
        permission: "orders.read",
        role: "owner",
        tenantId: "ten_mdu",
        tenantStatus: "active",
      }),
    ).toEqual({
      allowed: false,
      reason: "TENANT_MEMBERSHIP_MISMATCH",
    });
  });

  it("keeps tailor and counter roles away from reports, exports, and corrections", () => {
    expect(canRoleAccess("tailor", "production.update")).toBe(true);
    expect(canRoleAccess("tailor", "reports.read")).toBe(false);
    expect(
      getDeniedPermissionsForRole("counter_staff", [
        "payments.record",
        "payments.correct",
        "exports.create",
      ]),
    ).toEqual(["payments.correct", "exports.create"]);
  });

  it("requires platform support to have scoped, reasoned, unexpired tenant access", () => {
    const now = new Date("2026-07-06T10:00:00.000Z");

    expect(
      authorizeTenantPermission({
        membershipTenantId: "ten_mdu",
        now,
        permission: "customers.read",
        role: "platform_support",
        supportGrant: null,
        tenantId: "ten_mdu",
        tenantStatus: "active",
      }),
    ).toEqual({ allowed: false, reason: "SUPPORT_SCOPE_REQUIRED" });

    expect(
      authorizeTenantPermission({
        membershipTenantId: "ten_mdu",
        now,
        permission: "customers.read",
        role: "platform_support",
        supportGrant: {
          expiresAt: "2026-07-06T09:59:00.000Z",
          reason: "Debug failed receipt link",
          status: "active",
          tenantId: "ten_mdu",
        },
        tenantId: "ten_mdu",
        tenantStatus: "active",
      }),
    ).toEqual({ allowed: false, reason: "SUPPORT_SCOPE_EXPIRED" });

    expect(
      authorizeTenantPermission({
        membershipTenantId: "ten_mdu",
        now,
        permission: "customers.read",
        role: "platform_support",
        supportGrant: {
          expiresAt: "2026-07-06T10:30:00.000Z",
          reason: "Debug failed receipt link",
          status: "active",
          tenantId: "ten_mdu",
        },
        tenantId: "ten_mdu",
        tenantStatus: "active",
      }),
    ).toEqual({ allowed: true, reason: "ALLOWED" });
  });

  it("never exposes raw WhatsApp identifiers through public credential views", () => {
    const publicView = createCredentialPublicView({
      businessId: "102938475610293",
      phoneNumberId: "123456789012345",
      tokenLastRotatedAt: "2026-06-22T10:00:00+05:30",
      tokenRotationDueAt: "2026-07-21T10:00:00+05:30",
      tokenStatus: "valid",
    });

    expect(publicView.businessId).toBe("***********0293");
    expect(publicView.phoneNumberId).toBe("***********2345");
    expect(Object.values(publicView)).not.toContain("102938475610293");
    expect(maskSensitiveIdentifier("verify-token", 0)).toBe("************");
  });

  it("rejects expired, unsigned, and unconfirmed receipt/media links", () => {
    const now = new Date("2026-07-06T10:00:00.000Z");

    expect(
      evaluateSignedAccess({
        expiresAt: "2026-07-06T10:05:00.000Z",
        now,
        signatureValid: false,
      }),
    ).toEqual({ allowed: false, reason: "INVALID_SIGNATURE" });

    expect(
      evaluateSignedAccess({
        expiresAt: "2026-07-06T09:59:59.000Z",
        now,
        signatureValid: true,
      }),
    ).toEqual({ allowed: false, reason: "EXPIRED" });

    expect(
      evaluateSignedAccess({
        confirmationRequired: true,
        confirmationSatisfied: false,
        expiresAt: "2026-07-06T10:05:00.000Z",
        now,
        signatureValid: true,
      }),
    ).toEqual({ allowed: false, reason: "CONFIRMATION_REQUIRED" });

    expect(
      evaluateSignedAccess({
        confirmationRequired: true,
        confirmationSatisfied: true,
        expiresAt: "2026-07-06T10:05:00.000Z",
        now,
        signatureValid: true,
      }),
    ).toEqual({ allowed: true, reason: "ALLOWED" });
  });

  it("marks sensitive operational changes as audit-required", () => {
    expect(requiresSecurityAudit("measurement.edit")).toBe(true);
    expect(requiresSecurityAudit("payment.correct")).toBe(true);
    expect(requiresSecurityAudit("credential.rotate")).toBe(true);
    expect(requiresSecurityAudit("dashboard.read")).toBe(false);
  });
});
