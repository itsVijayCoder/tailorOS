export const SESSION_COOKIE = "tailoros_session";
export const SHOP_SLUG_COOKIE = "tailoros_shop_slug";
export const USER_EMAIL_COOKIE = "tailoros_user_email";
export const SETUP_TOKEN_COOKIE = "tailoros_setup_token";
export const SETUP_SHOP_COOKIE = "tailoros_setup_shop";
export const SETUP_EMAIL_COOKIE = "tailoros_setup_email";

export const defaultShopSlug = "sri-raja-tailors";
export const localDevToken = "pilot_owner_session_token_dev_2026";

export type AuthSessionPayload = {
  token: string;
  expiresAt: string;
  shopSlug: string;
  email: string;
};

export function cookieSecurityOptions(expiresAt?: string) {
  const expires = expiresAt ? new Date(expiresAt) : undefined;

  return {
    httpOnly: true,
    maxAge: expires
      ? Math.max(60, Math.floor((expires.getTime() - Date.now()) / 1000))
      : 14 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function setupCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function sanitizeRedirect(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/shop";
  }

  if (
    next.startsWith("/login") ||
    next.startsWith("/forgot-password") ||
    next.startsWith("/reset-password")
  ) {
    return "/shop";
  }

  return next;
}

export function controlPlaneBaseUrl() {
  return (
    process.env.TAILOROS_CONTROL_PLANE_URL ??
    process.env.TAILOROS_CONTROL_PLANE_BASE_URL ??
    "http://127.0.0.1:8789"
  ).replace(/\/$/, "");
}

export function gatewayBaseUrl() {
  return (
    process.env.TAILOROS_GATEWAY_URL ??
    process.env.TAILOROS_GATEWAY_BASE_URL ??
    "http://127.0.0.1:8788"
  ).replace(/\/$/, "");
}

export function tenantApiBaseUrlForSlug(slug: string) {
  return `${gatewayBaseUrl()}/v1/tenant/${encodeURIComponent(slug)}`;
}
