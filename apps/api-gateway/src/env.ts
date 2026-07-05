import type { RequestVariables } from "@tailoros/worker-runtime";

export type ApiGatewayVariables = RequestVariables & {
  tenantSlug?: string;
};

export type ApiGatewayEnv = {
  Bindings: Env;
  Variables: ApiGatewayVariables;
};
