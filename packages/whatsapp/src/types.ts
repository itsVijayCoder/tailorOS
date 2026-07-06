import type {
  NormalizedWhatsAppWebhookEvent,
  WhatsAppProvider,
  WhatsAppTemplateCategory,
  WhatsAppTemplatePurpose,
} from "@tailoros/schemas";

export type TemplateSendInput = {
  tenantId: string;
  to: string;
  phoneNumberId: string;
  templateName: string;
  languageCode: "en" | "ta";
  category: WhatsAppTemplateCategory;
  variables: Record<string, string>;
  variableKeys: readonly string[];
  clientMessageId: string;
  templatePurpose: WhatsAppTemplatePurpose;
};

export type TextSendInput = {
  tenantId: string;
  to: string;
  phoneNumberId: string;
  text: string;
  clientMessageId: string;
};

export type ProviderSendResult =
  | {
      accepted: true;
      providerMessageId: string;
      providerRequestId?: string;
      raw: unknown;
    }
  | {
      accepted: false;
      errorCode: string;
      errorMessage: string;
      retryable: boolean;
      raw: unknown;
    };

export type ProviderWebhookInput = {
  payload: unknown;
};

export type WhatsAppProviderAdapter = {
  provider: WhatsAppProvider;
  sendTemplate(input: TemplateSendInput): Promise<ProviderSendResult>;
  sendTextWithinServiceWindow(input: TextSendInput): Promise<ProviderSendResult>;
  normalizeWebhook(
    input: ProviderWebhookInput,
  ): Promise<NormalizedWhatsAppWebhookEvent[]>;
};
