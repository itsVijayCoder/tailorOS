import { queueEnvelopeSchema } from "@tailoros/schemas";

import { app } from "./app";

export default {
  fetch: app.fetch,
  async queue(batch, _env, ctx) {
    for (const message of batch.messages) {
      const parsed = queueEnvelopeSchema.safeParse(message.body);

      if (!parsed.success) {
        console.error(
          JSON.stringify({
            level: "error",
            worker: "control-plane",
            message: "Invalid provisioning queue payload.",
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
              worker: "control-plane",
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
