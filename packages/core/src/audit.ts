export type AuditActor = Readonly<{
  actorId: string;
  actorType: "user" | "system" | "support";
}>;

export type AuditMetadata = Readonly<{
  tenantId: string;
  requestId: string;
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  actor: AuditActor;
}>;

export function createAuditMetadata(input: Omit<AuditMetadata, "occurredAt">) {
  return {
    ...input,
    occurredAt: new Date().toISOString(),
  } satisfies AuditMetadata;
}
