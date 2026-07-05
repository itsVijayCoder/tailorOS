import { queueEnvelopeSchema } from "@tailoros/schemas";

export default {
  async fetch() {
    return Response.json({
      ok: true,
      data: {
        service: "whatsapp-consumer",
        boundary: "messaging-queues",
        status: "ok",
      },
      requestId: "queue-consumer-health",
    });
  },

  async queue(batch, _env, ctx) {
    for (const message of batch.messages) {
      const parsed = queueEnvelopeSchema.safeParse(message.body);

      if (!parsed.success) {
        console.error(
          JSON.stringify({
            level: "error",
            worker: "whatsapp-consumer",
            message: "Invalid WhatsApp queue payload.",
            issues: parsed.error.issues,
          }),
        );
        message.ack();
        continue;
      }

      ctx.waitUntil(
        Promise.resolve().then(() => {
          console.log(
            JSON.stringify({
              level: "info",
              worker: "whatsapp-consumer",
              job_id: parsed.data.id,
              job_type: parsed.data.type,
              idempotency_key: parsed.data.idempotencyKey,
            }),
          );
        }),
      );
      message.ack();
    }
  },
} satisfies ExportedHandler<Env, unknown>;
