import { z } from "zod";

const turnstileResponseSchema = z
  .object({
    success: z.boolean(),
    "error-codes": z.array(z.string()).optional(),
  })
  .passthrough();

export type TurnstileVerificationResult =
  { ok: true } | { ok: false; status: 400 | 503; message: string };

export async function verifyTurnstileToken(input: {
  token: string;
  remoteIp: string | null;
  env: Env;
}): Promise<TurnstileVerificationResult> {
  if (input.env.ENVIRONMENT === "local" && input.token.startsWith("test_")) {
    return { ok: true };
  }

  if (!input.env.TURNSTILE_SECRET_KEY) {
    return {
      ok: false,
      status: 503,
      message: "Turnstile verification is not configured.",
    };
  }

  const formData = new FormData();
  formData.set("secret", input.env.TURNSTILE_SECRET_KEY);
  formData.set("response", input.token);

  if (input.remoteIp) {
    formData.set("remoteip", input.remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );
  const body = (await response.json().catch(() => null)) as unknown;
  const parsed = turnstileResponseSchema.safeParse(body);

  if (!response.ok || !parsed.success) {
    return {
      ok: false,
      status: 503,
      message: "Turnstile verification is unavailable.",
    };
  }

  if (!parsed.data.success) {
    return {
      ok: false,
      status: 400,
      message: "Turnstile verification failed.",
    };
  }

  return { ok: true };
}
