import type {
  WhatsAppBlockedReason,
  WhatsAppChannelStatus,
  WhatsAppCredentialStatus,
  WhatsAppMessageStatus,
  WhatsAppTemplateStatus,
} from "@tailoros/schemas";

export type ConsentState = "opted_in" | "opted_out" | "unknown";

export type TemplateSendPolicyResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      reason: WhatsAppBlockedReason;
      retryable: boolean;
      staffAction: string;
    };

export function evaluateTemplateSendPolicy(input: {
  channelStatus: WhatsAppChannelStatus | null;
  credentialStatus: WhatsAppCredentialStatus | null;
  consentState: ConsentState;
  templateStatus: WhatsAppTemplateStatus | null;
  existingRequestStatus?: WhatsAppMessageStatus | null;
  isRequiredMessage?: boolean;
}): TemplateSendPolicyResult {
  if (input.existingRequestStatus) {
    return blocked({
      reason: "duplicate_request",
      retryable: false,
      staffAction: "Open the existing notification log instead of resending.",
    });
  }

  if (!input.channelStatus) {
    return blocked({
      reason: "missing_channel",
      retryable: false,
      staffAction: "Connect an active WhatsApp channel account for this tenant.",
    });
  }

  if (input.channelStatus !== "active" || input.credentialStatus !== "active") {
    return blocked({
      reason: "provider_health_issue",
      retryable: true,
      staffAction: "Check channel health and rotate or reconnect credentials.",
    });
  }

  if (input.consentState === "opted_out" && !input.isRequiredMessage) {
    return blocked({
      reason: "opted_out",
      retryable: false,
      staffAction: "Use a non-WhatsApp fallback unless the customer opts in again.",
    });
  }

  if (input.consentState !== "opted_in" && !input.isRequiredMessage) {
    return blocked({
      reason: "missing_consent",
      retryable: false,
      staffAction: "Capture WhatsApp consent on the customer contact method.",
    });
  }

  if (!input.templateStatus || input.templateStatus !== "approved") {
    return blocked({
      reason: "missing_template",
      retryable: false,
      staffAction: "Map and approve the tenant template in the requested language.",
    });
  }

  return { allowed: true };
}

function blocked(input: {
  reason: WhatsAppBlockedReason;
  retryable: boolean;
  staffAction: string;
}): TemplateSendPolicyResult {
  return {
    allowed: false,
    reason: input.reason,
    retryable: input.retryable,
    staffAction: input.staffAction,
  };
}
