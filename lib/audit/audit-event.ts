export type AuditEventInput = {
  businessId?: string;
  actorUserId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export function createAuditEvent(input: AuditEventInput) {
  return {
    id: `audit_${crypto.randomUUID()}`,
    businessId: input.businessId ?? null,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString()
  };
}
