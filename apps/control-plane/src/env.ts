import type { RequestVariables } from "@tailoros/worker-runtime";

export type ControlPlaneEnv = {
  Bindings: Env;
  Variables: RequestVariables;
};
