const DEFAULT_SERVICE_WINDOW_HOURS = 24;

export function getServiceWindowExpiresAt(input: {
  lastInboundAt: string | Date;
  windowHours?: number;
}) {
  const inboundAt =
    input.lastInboundAt instanceof Date
      ? input.lastInboundAt
      : new Date(input.lastInboundAt);

  return new Date(
    inboundAt.getTime() +
      (input.windowHours ?? DEFAULT_SERVICE_WINDOW_HOURS) * 60 * 60 * 1000,
  );
}

export function isInsideServiceWindow(input: {
  lastInboundAt: string | Date | null;
  now?: string | Date;
  windowHours?: number;
}) {
  if (!input.lastInboundAt) {
    return false;
  }

  const now = input.now
    ? input.now instanceof Date
      ? input.now
      : new Date(input.now)
    : new Date();
  const expiresAt = getServiceWindowExpiresAt({
    lastInboundAt: input.lastInboundAt,
    ...(input.windowHours ? { windowHours: input.windowHours } : {}),
  });

  return now.getTime() <= expiresAt.getTime();
}
