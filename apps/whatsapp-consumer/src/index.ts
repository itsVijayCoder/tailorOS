import { queueEnvelopeSchema } from "@tailoros/schemas";

import {
  D1WhatsAppConsumerRepository,
  processWhatsAppQueueEnvelope,
} from "./processor";

export default {
  async fetch() {
    return Response.json({
      data: {
        boundary: "messaging-queues",
        service: "whatsapp-consumer",
        status: "ok",
      },
      ok: true,
      requestId: "queue-consumer-health",
    });
  },

  async queue(batch, env) {
    const repository = new D1WhatsAppConsumerRepository(env.CONNECTOR_DB);

    for (const message of batch.messages) {
      const parsed = queueEnvelopeSchema.safeParse(message.body);

      if (!parsed.success) {
        console.error(
          JSON.stringify({
            issues: parsed.error.issues,
            level: "error",
            message: "Invalid WhatsApp queue payload.",
            worker: "whatsapp-consumer",
          }),
        );
        message.ack();
        continue;
      }

      const result = await processWhatsAppQueueEnvelope({
        attempts: message.attempts,
        env,
        envelope: parsed.data,
        repository,
      });

      if (result.action === "retry") {
        message.retry({ delaySeconds: result.delaySeconds });
      } else {
        message.ack();
      }
    }
  },
} satisfies ExportedHandler<Env, unknown>;
