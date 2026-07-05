export type EntityPrefix =
  | "TEN"
  | "TDB"
  | "TWR"
  | "MBR"
  | "AUD"
  | "FAM"
  | "CUS"
  | "ORD"
  | "ITM"
  | "PAY"
  | "RCT"
  | "MSG"
  | "JOB"
  | "REQ";

const suffixPattern = /^[A-Z0-9]{3,12}$/;

export function createStableId(input: {
  prefix: EntityPrefix;
  shopCode?: string;
  entropy?: string;
}): string {
  const shopCode = input.shopCode ? normalizeIdSegment(input.shopCode) : null;
  const entropy = input.entropy
    ? normalizeIdSegment(input.entropy)
    : randomHex(8).toUpperCase();

  return [input.prefix, shopCode, entropy].filter(Boolean).join("-");
}

export function normalizeIdSegment(segment: string): string {
  const normalized = segment
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12);

  if (!suffixPattern.test(normalized)) {
    throw new Error("ID segment must contain 3 to 12 letters or numbers.");
  }

  return normalized;
}

function randomHex(bytesLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
