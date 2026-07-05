import { Hono } from "hono";

import {
  createQueueEnvelope,
  sendTemplateMessageSchema,
  zodIssuesToFieldErrors,
} from "@tailoros/schemas";
import {
  createErrorHandler,
  createNotFoundHandler,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";

import type { WhatsAppConnectorEnv } from "./env";

export const app = new Hono<WhatsAppConnectorEnv>();

app.use("*", requestIdMiddleware());

app.get("/health", (c) =>
  jsonSuccess(c, {
    service: "whatsapp-connector",
    boundary: "messaging-policy",
    status: "ok",
  }),
);

app.post("/v1/messages/template", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = sendTemplateMessageSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Template message request is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const envelope = createQueueEnvelope({
    type: "whatsapp.send-template",
    version: 1,
    id: `JOB-${parsed.data.idempotencyKey.replace(/[^A-Za-z0-9]/g, "").slice(0, 24)}`,
    idempotencyKey: parsed.data.idempotencyKey,
    payload: parsed.data,
  });

  await c.env.WHATSAPP_SEND_QUEUE.send(envelope);
  return jsonSuccess(c, { queuedJobId: envelope.id }, 202);
});

app.get("/webhooks/meta", (c) => {
  const mode = c.req.query("hub.mode");
  const challenge = c.req.query("hub.challenge");
  const verifyToken = c.req.query("hub.verify_token");

  if (mode !== "subscribe" || !challenge || !verifyToken) {
    return jsonError(c, {
      code: "BAD_REQUEST",
      message: "Webhook verification request is invalid.",
      status: 400,
    });
  }

  return c.text(challenge);
});

app.post("/webhooks/meta", async (c) => {
  const signature = c.req.header("x-hub-signature-256");
  if (!signature) {
    return jsonError(c, {
      code: "UNAUTHORIZED",
      message: "Missing Meta webhook signature.",
      status: 401,
    });
  }

  const webhookBody = (await c.req.json().catch(() => null)) as unknown;
  const envelope = createQueueEnvelope({
    type: "whatsapp.process-webhook",
    version: 1,
    id: `JOB-WA-${Date.now()}`,
    idempotencyKey: `webhook:${signature.slice(0, 48)}`,
    payload: { signature, webhookBody },
  });

  await c.env.WHATSAPP_WEBHOOK_QUEUE.send(envelope);
  return jsonSuccess(c, { queuedJobId: envelope.id }, 202);
});

app.notFound(createNotFoundHandler<WhatsAppConnectorEnv>());
app.onError(createErrorHandler<WhatsAppConnectorEnv>());
