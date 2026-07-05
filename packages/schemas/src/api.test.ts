import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  apiErrorSchema,
  apiSuccessSchema,
  createApiError,
  createApiSuccess,
  zodIssuesToFieldErrors,
} from "./api";
import { createQueueEnvelope, queueEnvelopeSchema } from "./queue";

describe("API response contracts", () => {
  it("validates the shared success shape", () => {
    const response = createApiSuccess({ health: "ok" }, "req_contract_01");
    const parsed = apiSuccessSchema(
      z.object({ health: z.literal("ok") }),
    ).safeParse(response);

    expect(parsed.success).toBe(true);
  });

  it("validates the shared error shape", () => {
    const response = createApiError({
      code: "VALIDATION_ERROR",
      message: "Invalid payload.",
      requestId: "req_contract_02",
      fields: { ownerEmail: ["Invalid email."] },
    });

    expect(apiErrorSchema.safeParse(response).success).toBe(true);
  });

  it("maps all Zod issues into field errors", () => {
    const result = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
      })
      .safeParse({ name: "", email: "bad" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodIssuesToFieldErrors(result.error.issues)).toEqual({
        name: ["Too small: expected string to have >=2 characters"],
        email: ["Invalid email address"],
      });
    }
  });

  it("requires queue payload versions and idempotency keys", () => {
    const envelope = createQueueEnvelope({
      type: "whatsapp.send-template",
      version: 1,
      id: "job_01phase01",
      idempotencyKey: "wa:tenant:order:001",
      payload: { orderId: "ord_001" },
      createdAt: "2026-07-05T00:00:00.000Z",
    });

    expect(queueEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });
});
