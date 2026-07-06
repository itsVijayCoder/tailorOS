"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { ApiResponse } from "@tailoros/schemas";

import type { AuthActionState } from "./action-state";
import {
  controlPlaneBaseUrl,
  cookieSecurityOptions,
  SESSION_COOKIE,
  SETUP_EMAIL_COOKIE,
  SETUP_SHOP_COOKIE,
  SETUP_TOKEN_COOKIE,
  setupCookieOptions,
  SHOP_SLUG_COOKIE,
  sanitizeRedirect,
  USER_EMAIL_COOKIE,
} from "./session";

type AuthResponse = {
  session: {
    token: string;
    expiresAt: string;
    requiresPasswordSetup: boolean;
  };
  tenant: {
    slug: string;
    businessName: string;
  };
  user: {
    email: string;
    displayName: string;
    role: string;
  };
};

type ResetRequestResponse = {
  accepted: true;
  devResetToken: string | null;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const next = sanitizeRedirect(formData.get("next"));
  const fields = {
    email: requiredString(formData.get("email")).toLowerCase(),
    password: requiredString(formData.get("password")),
    shopSlug: requiredString(formData.get("shopSlug")),
  };
  const fieldErrors = validateLoginFields(fields);

  if (fieldErrors) {
    return {
      fields: fieldErrors,
      message: "Fix the highlighted login fields.",
      status: "error",
    };
  }

  const result = await postControlPlane<AuthResponse>("/v1/auth/login", fields);

  if (result.error) {
    return {
      message: result.error,
      status: "error",
    };
  }

  if (result.data.session.requiresPasswordSetup) {
    const cookieStore = await cookies();
    const options = setupCookieOptions();
    cookieStore.set(SETUP_TOKEN_COOKIE, result.data.session.token, options);
    cookieStore.set(SETUP_SHOP_COOKIE, result.data.tenant.slug, options);
    cookieStore.set(SETUP_EMAIL_COOKIE, result.data.user.email, options);
    redirect("/reset-password?mode=setup");
  }

  await setAuthCookies({
    email: result.data.user.email,
    expiresAt: result.data.session.expiresAt,
    shopSlug: result.data.tenant.slug,
    token: result.data.session.token,
  });

  redirect(next);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  for (const name of [
    SESSION_COOKIE,
    SHOP_SLUG_COOKIE,
    USER_EMAIL_COOKIE,
    SETUP_TOKEN_COOKIE,
    SETUP_SHOP_COOKIE,
    SETUP_EMAIL_COOKIE,
  ]) {
    cookieStore.delete(name);
  }

  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fields = {
    email: requiredString(formData.get("email")).toLowerCase(),
    shopSlug: requiredString(formData.get("shopSlug")),
  };
  const fieldErrors = validateResetRequestFields(fields);

  if (fieldErrors) {
    return {
      fields: fieldErrors,
      message: "Fix the highlighted recovery fields.",
      status: "error",
    };
  }

  const result = await postControlPlane<ResetRequestResponse>(
    "/v1/auth/password-reset/request",
    fields,
  );

  if (result.error) {
    return {
      message: result.error,
      status: "error",
    };
  }

  const devResetLink = result.data.devResetToken
    ? `/reset-password?token=${encodeURIComponent(result.data.devResetToken)}`
    : null;

  return {
    devResetLink,
    message:
      "If the account exists, a reset link has been issued. For local development, use the reset link shown below.",
    status: "success",
  };
}

export async function confirmPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const mode = requiredString(formData.get("mode"));
  const newPassword = requiredString(formData.get("newPassword"));
  const confirmPassword = requiredString(formData.get("confirmPassword"));

  if (newPassword.length < 10 || newPassword !== confirmPassword) {
    return {
      fields: {
        confirmPassword:
          newPassword !== confirmPassword ? ["Passwords do not match."] : [],
        newPassword:
          newPassword.length < 10 ? ["Use at least 10 characters."] : [],
      },
      message: "Fix the highlighted password fields.",
      status: "error",
    };
  }

  const result =
    mode === "setup"
      ? await setupPasswordFromCookie(newPassword)
      : await postControlPlane<AuthResponse>(
          "/v1/auth/password-reset/confirm",
          {
            newPassword,
            token: requiredString(formData.get("token")),
          },
        );

  if (result.error) {
    return {
      message: result.error,
      status: "error",
    };
  }

  await setAuthCookies({
    email: result.data.user.email,
    expiresAt: result.data.session.expiresAt,
    shopSlug: result.data.tenant.slug,
    token: result.data.session.token,
  });
  await clearSetupCookies();

  redirect("/shop");
}

async function setupPasswordFromCookie(newPassword: string) {
  const cookieStore = await cookies();
  const setupToken = cookieStore.get(SETUP_TOKEN_COOKIE)?.value ?? "";
  const shopSlug = cookieStore.get(SETUP_SHOP_COOKIE)?.value ?? "";
  const email = cookieStore.get(SETUP_EMAIL_COOKIE)?.value ?? "";

  if (!setupToken || !shopSlug || !email) {
    return {
      data: null as never,
      error: "Setup session expired. Sign in with the owner setup token again.",
    };
  }

  return postControlPlane<AuthResponse>("/v1/auth/setup-password", {
    email,
    newPassword,
    setupToken,
    shopSlug,
  });
}

async function setAuthCookies(input: {
  email: string;
  expiresAt: string;
  shopSlug: string;
  token: string;
}) {
  const cookieStore = await cookies();
  const options = cookieSecurityOptions(input.expiresAt);
  cookieStore.set(SESSION_COOKIE, input.token, options);
  cookieStore.set(SHOP_SLUG_COOKIE, input.shopSlug, options);
  cookieStore.set(USER_EMAIL_COOKIE, input.email, options);
}

async function clearSetupCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SETUP_TOKEN_COOKIE);
  cookieStore.delete(SETUP_SHOP_COOKIE);
  cookieStore.delete(SETUP_EMAIL_COOKIE);
}

async function postControlPlane<T>(path: string, body: unknown) {
  try {
    const response = await fetch(`${controlPlaneBaseUrl()}${path}`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !payload.ok) {
      return {
        data: null as never,
        error: payload.ok
          ? `Auth service returned HTTP ${response.status}.`
          : payload.error.message,
      };
    }

    return { data: payload.data, error: null };
  } catch (error) {
    return {
      data: null as never,
      error:
        error instanceof Error ? error.message : "Auth service is unavailable.",
    };
  }
}

function validateLoginFields(fields: {
  email: string;
  password: string;
  shopSlug: string;
}) {
  const errors: Record<string, string[]> = {};

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.shopSlug)) {
    errors.shopSlug = ["Enter a valid shop slug."];
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = ["Enter a valid email."];
  }
  if (fields.password.length < 8) {
    errors.password = ["Enter your password or owner setup token."];
  }

  return Object.keys(errors).length ? errors : null;
}

function validateResetRequestFields(fields: {
  email: string;
  shopSlug: string;
}) {
  const errors: Record<string, string[]> = {};

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.shopSlug)) {
    errors.shopSlug = ["Enter a valid shop slug."];
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = ["Enter a valid email."];
  }

  return Object.keys(errors).length ? errors : null;
}

function requiredString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
