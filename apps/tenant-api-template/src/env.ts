import type { RequestVariables } from "@tailoros/worker-runtime";

export type TenantApiEnv = {
  Bindings: Env;
  Variables: RequestVariables;
};
