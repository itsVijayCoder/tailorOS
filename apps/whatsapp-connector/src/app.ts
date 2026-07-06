import { Hono } from "hono";
import type { Context } from "hono";

import { evaluateTemplateSendPolicy } from "@tailoros/message-policy";
import {
  createQueueEnvelope,
  sendTemplateMessageSchema,
  whatsappTemplateSendJobPayloadSchema,
  whatsappWebhookJobPayloadSchema,
  zodIssuesToFieldErrors,
} from "@tailoros/schemas";
import { normalizeMetaWebhook } from "@tailoros/whatsapp";
import {
  sha256Hex,
  timingSafeEqual,
  verifyMetaSignature,
} from "@tailoros/whatsapp";
import {
  createErrorHandler,
  createNotFoundHandler,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";

import type { WhatsAppConnectorEnv } from "./env";
import {
  D1WhatsAppConnectorRepository,
  type WhatsAppConnectorRepository,
} from "./store";

type ConnectorDependencies = {
  now?: () => Date;
  repository?: (env: Env) => WhatsAppConnectorRepository;
};

export function createWhatsAppConnectorApp(
  dependencies: ConnectorDependencies = {},
) {
  const app = new Hono<WhatsAppConnectorEnv>();
  const now = dependencies.now ?? (() => new Date());
  const repositoryFactory =
    dependencies.repository ??
    ((env: Env) => new D1WhatsAppConnectorRepository(env.CONNECTOR_DB));

  app.use("*", requestIdMiddleware());

  app.get("/health", (c) =>
    jsonSuccess(c, {
      boundary: "messaging-policy",
      service: "whatsapp-connector",
      status: "ok",
    }),
  );

  app.get("/v1/admin/overview", async (c) => {
    const internal = await requireInternalService(c.req.raw, c.env);
    if (!internal.ok) {
      return unauthorized(c, internal.message);
    }

    const overview = await repositoryFactory(c.env).getOverview();
    return jsonSuccess(c, { overview });
  });

  app.post("/v1/messages/template", async (c) => {
    const internal = await requireInternalService(c.req.raw, c.env);
    if (!internal.ok) {
      return unauthorized(c, internal.message);
    }

    const body = (await c.req.json().catch(() => null)) as unknown;
    const parsed = sendTemplateMessageSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(c, {
        code: "VALIDATION_ERROR",
        fields: zodIssuesToFieldErrors(parsed.error.issues),
        message: "Template message request is invalid.",
        status: 400,
      });
    }

    const repository = repositoryFactory(c.env);
    const existing = await repository.findMessageRequestByIdempotencyKey({
      idempotencyKey: parsed.data.idempotencyKey,
      tenantId: parsed.data.tenantId,
    });

    if (existing) {
      return jsonSuccess(
        c,
        {
          idempotent: true,
          messageRequestId: existing.id,
          status: existing.status,
          ...(existing.blockedReason
            ? { blockedReason: existing.blockedReason }
            : {}),
        },
        202,
      );
    }

    const readiness = await repository.getTemplateSendReadiness(parsed.data);
    const policy = evaluateTemplateSendPolicy({
      channelStatus: readiness.channel?.status ?? null,
      consentState: readiness.consentState,
      credentialStatus: readiness.channel?.credentialStatus ?? null,
      templateStatus: readiness.template?.status ?? null,
    });
    const timestamp = now().toISOString();

    if (!policy.allowed) {
      const blocked = await repository.insertBlockedMessageRequest({
        blockedReason: policy.reason,
        now: timestamp,
        request: parsed.data,
      });

      return jsonSuccess(
        c,
        {
          blockedReason: policy.reason,
          messageRequestId: blocked.id,
          retryable: policy.retryable,
          staffAction: policy.staffAction,
          status: "blocked",
        },
        202,
      );
    }

    if (!readiness.channel || !readiness.template) {
      return jsonError(c, {
        code: "INTERNAL_ERROR",
        message: "Connector policy allowed a send without channel readiness.",
        status: 500,
      });
    }

    const queued = await repository.insertQueuedMessageRequest({
      channel: readiness.channel,
      now: timestamp,
      request: parsed.data,
      template: readiness.template,
    });
    const sendJobPayload = whatsappTemplateSendJobPayloadSchema.parse({
      channel: readiness.channel,
      contactMethodId: parsed.data.recipient.contactMethodId,
      idempotencyKey: parsed.data.idempotencyKey,
      language: parsed.data.language,
      productCode: parsed.data.productCode,
      recipientPhoneE164: parsed.data.recipient.phoneE164,
      requestId: queued.id,
      template: readiness.template,
      templatePurpose: parsed.data.templatePurpose,
      tenantId: parsed.data.tenantId,
      variables: parsed.data.variables,
    });
    const envelope = createQueueEnvelope({
      id: buildJobId("JOB-WAS", parsed.data.idempotencyKey),
      idempotencyKey: parsed.data.idempotencyKey,
      payload: { ...sendJobPayload },
      type: "whatsapp.send-template",
      version: 1,
    });

    await repository.insertOutboxJob({
      id: envelope.id,
      idempotencyKey: envelope.idempotencyKey,
      messageRequestId: queued.id,
      now: timestamp,
      payload: { ...sendJobPayload },
      tenantId: parsed.data.tenantId,
    });
    await c.env.WHATSAPP_SEND_QUEUE.send(envelope);

    return jsonSuccess(
      c,
      {
        messageRequestId: queued.id,
        queuedJobId: envelope.id,
        status: "queued",
      },
      202,
    );
  });

  app.get("/webhooks/meta", async (c) => {
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

    const receivedHash = await sha256Hex(verifyToken);
    if (!timingSafeEqual(receivedHash, c.env.META_WEBHOOK_VERIFY_TOKEN_HASH)) {
      return jsonError(c, {
        code: "UNAUTHORIZED",
        message: "Webhook verify token is invalid.",
        status: 401,
      });
    }

    return c.text(challenge);
  });

  app.post("/webhooks/meta", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("x-hub-signature-256");
    const signatureValid = await verifyMetaSignature({
      appSecret: c.env.META_APP_SECRET,
      rawBody,
      signatureHeader: signature ?? null,
    });

    if (!signatureValid) {
      return jsonError(c, {
        code: "UNAUTHORIZED",
        message: "Meta webhook signature is invalid.",
        status: 401,
      });
    }

    const webhookBody = JSON.parse(rawBody) as unknown;
    const normalizedEvents = normalizeMetaWebhook(webhookBody);

    if (normalizedEvents.length === 0) {
      return jsonSuccess(c, { ignored: true, queuedEventCount: 0 }, 202);
    }

    const phoneNumberId = normalizedEvents[0]?.phoneNumberId;
    if (!phoneNumberId) {
      return jsonError(c, {
        code: "BAD_REQUEST",
        message: "Meta webhook did not include a phone number ID.",
        status: 400,
      });
    }

    const repository = repositoryFactory(c.env);
    const channel = await repository.findChannelByPhoneNumberId(phoneNumberId);
    if (!channel || channel.status !== "active") {
      return jsonError(c, {
        code: "NOT_FOUND",
        message: "No active channel account matches this Meta phone number ID.",
        status: 404,
      });
    }

    const timestamp = now().toISOString();
    const payloadSha256 = await sha256Hex(rawBody);
    const rawPayloadJson = rawBody.length <= 10_000 ? rawBody : null;

    await Promise.all(
      normalizedEvents.map((event) =>
        repository.insertWebhookEvent({
          eventId: crypto.randomUUID(),
          eventType: event.type,
          now: timestamp,
          payloadSha256,
          phoneNumberId: event.phoneNumberId,
          provider: event.provider,
          providerEventId: event.providerEventId,
          providerMessageId: event.providerMessageId ?? null,
          rawPayloadJson,
        }),
      ),
    );

    const webhookPayload = whatsappWebhookJobPayloadSchema.parse({
      events: normalizedEvents,
      payloadSha256,
      phoneNumberId,
      provider: "meta",
    });
    const envelope = createQueueEnvelope({
      id: buildJobId("JOB-WAW", payloadSha256),
      idempotencyKey: `webhook:${payloadSha256.slice(0, 48)}`,
      payload: { ...webhookPayload },
      type: "whatsapp.process-webhook",
      version: 1,
    });

    await c.env.WHATSAPP_WEBHOOK_QUEUE.send(envelope);
    return jsonSuccess(
      c,
      { queuedEventCount: normalizedEvents.length, queuedJobId: envelope.id },
      202,
    );
  });

  app.notFound(createNotFoundHandler<WhatsAppConnectorEnv>());
  app.onError(createErrorHandler<WhatsAppConnectorEnv>());

  return app;
}

export const app = createWhatsAppConnectorApp();

async function requireInternalService(request: Request, env: Env) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return {
      ok: false,
      message: "Internal service token is required.",
    } as const;
  }

  const accepted = timingSafeEqual(token, env.INTERNAL_SERVICE_TOKEN);

  return accepted
    ? ({ ok: true } as const)
    : ({
        ok: false,
        message: "Internal service token is invalid.",
      } as const);
}

function unauthorized(
  c: Context<WhatsAppConnectorEnv>,
  message: string,
) {
  return jsonError(c, {
    code: "UNAUTHORIZED",
    message,
    status: 401,
  });
}

function buildJobId(prefix: string, idempotencyKey: string) {
  const suffix = idempotencyKey.replace(/[^A-Za-z0-9]/g, "").slice(0, 24);
  return `${prefix}-${suffix || crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}
