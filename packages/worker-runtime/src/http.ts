import { createMiddleware } from "hono/factory";
import type { Context, ErrorHandler, NotFoundHandler } from "hono";

import { createStableId } from "@tailoros/core";
import {
  createApiError,
  createApiSuccess,
  type ApiErrorCode,
} from "@tailoros/schemas";

import {
  createLogEntry,
  logWorkerEvent,
  readRuntimeMetadata,
} from "./observability";

export type RequestVariables = {
  requestId: string;
};

type ErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;
type EnvWithRequestVariables = {
  Variables: RequestVariables;
};

export function createRequestId() {
  return createStableId({ prefix: "REQ" }).replace("REQ-", "req_");
}

export function requestIdMiddleware() {
  return createMiddleware<{ Variables: RequestVariables }>(async (c, next) => {
    const incoming = c.req.header("x-request-id")?.trim();
    const requestId =
      incoming && incoming.length >= 8 && incoming.length <= 128
        ? incoming
        : createRequestId();

    c.set("requestId", requestId);
    await next();
    c.header("x-request-id", requestId);
  });
}

export function getRequestId<Env extends EnvWithRequestVariables>(
  c: Context<Env>,
) {
  return c.get("requestId") ?? createRequestId();
}

export function jsonSuccess<Env extends EnvWithRequestVariables, T>(
  c: Context<Env>,
  data: T,
  status: 200 | 201 | 202 = 200,
) {
  return c.json(createApiSuccess(data, getRequestId(c)), status);
}

export function jsonError<Env extends EnvWithRequestVariables>(
  c: Context<Env>,
  input: {
    code: ApiErrorCode;
    message: string;
    status: ErrorStatusCode;
    fields?: Record<string, string[]>;
  },
) {
  return c.json(
    createApiError({
      code: input.code,
      message: input.message,
      requestId: getRequestId(c),
      ...(input.fields ? { fields: input.fields } : {}),
    }),
    input.status,
  );
}

export function createNotFoundHandler<Env extends EnvWithRequestVariables>() {
  return ((c) =>
    jsonError(c, {
      code: "NOT_FOUND",
      message: "Route not found.",
      status: 404,
    })) satisfies NotFoundHandler<Env>;
}

export function createErrorHandler<Env extends EnvWithRequestVariables>() {
  return ((error, c) => {
    logWorkerEvent(
      createLogEntry({
        context: {
          requestId: getRequestId(c),
          route: `${c.req.method} ${new URL(c.req.url).pathname}`,
        },
        error,
        event: "worker.request.error",
        level: "error",
        message: "Unhandled worker request error.",
        metadata: readRuntimeMetadata(
          c.env as Partial<
            Record<"ENVIRONMENT" | "RELEASE_VERSION" | "SERVICE_NAME", string>
          >,
          { worker: "worker-runtime" },
        ),
        statusCode: 500,
      }),
    );

    return jsonError(c, {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error.",
      status: 500,
    });
  }) satisfies ErrorHandler<Env>;
}

export type ServiceBinding = {
  fetch(request: Request): Promise<Response>;
};

export function createInternalJsonRequest(input: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  requestId: string;
}) {
  const init: RequestInit = {
    method: input.method ?? "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-service": "tailoros",
      "x-request-id": input.requestId,
    },
  };

  if (input.body !== undefined) {
    init.body = JSON.stringify(input.body);
  }

  return new Request(`https://internal.tailoros${input.path}`, {
    ...init,
  });
}
