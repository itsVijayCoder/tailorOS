import type {
  ApiResponse,
  PlatformTenantOnboardingRequest,
  PlatformTenantOnboardingResponse,
  TenantProvisioningSummary,
} from "@tailoros/schemas";

export type ControlPlaneApiState<T> =
  | {
      data: T;
      error: null;
      source: "control-plane";
    }
  | {
      data: T;
      error: string;
      source: "offline";
    };

const localAdminToken = "local_super_admin_token_dev_2026";

export async function readControlPlaneTenants(): Promise<
  ControlPlaneApiState<{ tenants: TenantProvisioningSummary[] }>
> {
  return controlPlaneGet("/v1/tenants?limit=100", { tenants: [] });
}

export async function onboardTenant(
  input: PlatformTenantOnboardingRequest,
): Promise<ControlPlaneApiState<PlatformTenantOnboardingResponse>> {
  return controlPlanePost("/v1/admin/tenants/onboard", input, {
    ownerAccess: {
      email: input.ownerEmail,
      expiresAt: new Date().toISOString(),
      loginHint: "",
      membershipId: "",
      role: "owner",
      sessionId: "",
      sessionToken: "",
      tenantApiPath: `/v1/tenant/${input.preferredSlug}`,
      userId: "",
    },
    provisioning: {
      provisioningUrl: "",
      queuedJobId: "",
      reusedExistingRequest: false,
      slug: input.preferredSlug,
      status: "requested",
      tenantId: "",
    },
  });
}

async function controlPlaneGet<T>(
  path: string,
  fallback: T,
): Promise<ControlPlaneApiState<T>> {
  const baseUrl = controlPlaneBaseUrl();

  if (!baseUrl) {
    return {
      data: fallback,
      error: "Control-plane API base URL is not configured.",
      source: "offline",
    };
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    const body = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !body.ok) {
      return {
        data: fallback,
        error: body.ok
          ? `Control-plane API returned HTTP ${response.status}.`
          : body.error.message,
        source: "offline",
      };
    }

    return { data: body.data, error: null, source: "control-plane" };
  } catch (error) {
    return {
      data: fallback,
      error:
        error instanceof Error ? error.message : "Control-plane API failed.",
      source: "offline",
    };
  }
}

async function controlPlanePost<T>(
  path: string,
  body: unknown,
  fallback: T,
): Promise<ControlPlaneApiState<T>> {
  const baseUrl = controlPlaneBaseUrl();
  const token = platformAdminToken();

  if (!baseUrl || !token) {
    return {
      data: fallback,
      error: "Control-plane API base URL or platform token is not configured.",
      source: "offline",
    };
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      body: JSON.stringify(body),
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      method: "POST",
    });
    const responseBody = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !responseBody.ok) {
      return {
        data: fallback,
        error: responseBody.ok
          ? `Control-plane API returned HTTP ${response.status}.`
          : responseBody.error.message,
        source: "offline",
      };
    }

    return {
      data: responseBody.data,
      error: null,
      source: "control-plane",
    };
  } catch (error) {
    return {
      data: fallback,
      error:
        error instanceof Error ? error.message : "Control-plane API failed.",
      source: "offline",
    };
  }
}

function controlPlaneBaseUrl() {
  return (
    process.env.TAILOROS_CONTROL_PLANE_BASE_URL ??
    (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8789")
  ).replace(/\/$/, "");
}

function platformAdminToken() {
  return (
    process.env.TAILOROS_PLATFORM_ADMIN_TOKEN ??
    (process.env.NODE_ENV === "production" ? "" : localAdminToken)
  );
}
