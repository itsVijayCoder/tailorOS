import { z } from "zod";

export const requestIdSchema = z
  .string()
  .trim()
  .min(8, "Request ID must be at least 8 characters.")
  .max(128, "Request ID must be at most 128 characters.");

export const apiErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "VALIDATION_ERROR",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
]);

export const fieldErrorsSchema = z.record(
  z.string().min(1),
  z.array(z.string().min(1)),
);

export const apiErrorBodySchema = z
  .object({
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    fields: fieldErrorsSchema.optional(),
  })
  .strict();

export const apiErrorSchema = z
  .object({
    ok: z.literal(false),
    error: apiErrorBodySchema,
    requestId: requestIdSchema,
  })
  .strict();

export function apiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z
    .object({
      ok: z.literal(true),
      data: dataSchema,
      requestId: requestIdSchema,
    })
    .strict();
}

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function createApiSuccess<T>(data: T, requestId: string): ApiSuccess<T> {
  return {
    ok: true,
    data,
    requestId,
  };
}

export function createApiError(input: {
  code: ApiErrorCode;
  message: string;
  requestId: string;
  fields?: Record<string, string[]>;
}): ApiError {
  return {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      ...(input.fields ? { fields: input.fields } : {}),
    },
    requestId: input.requestId,
  };
}

export function zodIssuesToFieldErrors(
  issues: z.core.$ZodIssue[],
): Record<string, string[]> {
  return issues.reduce<Record<string, string[]>>((fields, issue) => {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    fields[key] = [...(fields[key] ?? []), issue.message];
    return fields;
  }, {});
}
