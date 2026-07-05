import type { RequestVariables } from "@tailoros/worker-runtime";

export type WhatsAppConnectorEnv = {
  Bindings: Env;
  Variables: RequestVariables;
};
