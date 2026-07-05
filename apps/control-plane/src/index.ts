import { queueEnvelopeSchema } from "@tailoros/schemas";

import { app } from "./app";
import { D1ControlPlaneStore } from "./control-store";
import {
  processTenantProvisionEnvelope,
  readProvisioningRuntimeConfig,
} from "./provisioning";

export default {
  fetch: app.fetch,
  async queue(batch, env, _ctx) {
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

      if (parsed.data.type !== "tenant.provision") {
        console.warn(
          JSON.stringify({
            level: "warn",
            worker: "control-plane",
            message: "Unsupported queue job type.",
            job_id: parsed.data.id,
            job_type: parsed.data.type,
          }),
        );
        message.ack();
        continue;
      }

      try {
        await processTenantProvisionEnvelope({
          envelopeBody: parsed.data,
          store: new D1ControlPlaneStore(env.CONTROL_DB),
          queue: env.TENANT_MIGRATION_QUEUE,
          config: readProvisioningRuntimeConfig(env),
        });
        console.log(
          JSON.stringify({
            level: "info",
            worker: "control-plane",
            message: "Tenant provisioning queue message processed.",
            job_id: parsed.data.id,
            job_type: parsed.data.type,
            idempotency_key: parsed.data.idempotencyKey,
          }),
        );
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            worker: "control-plane",
            message: "Tenant provisioning queue message failed.",
            job_id: parsed.data.id,
            job_type: parsed.data.type,
            error: error instanceof Error ? error.message : "Unknown error.",
          }),
        );
      }

      message.ack();
    }
  },
} satisfies ExportedHandler<Env, unknown>;
