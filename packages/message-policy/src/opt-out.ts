const optOutPhrases = new Set([
  "stop",
  "stop all",
  "unsubscribe",
  "cancel",
  "no whatsapp",
  "dont message",
  "do not message",
  "vendam",
  "வேண்டாம்",
  "நிறுத்து",
  "ஸ்டாப்",
]);

export function normalizeCustomerMessageText(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

export function isOptOutText(text: string) {
  return optOutPhrases.has(normalizeCustomerMessageText(text));
}
