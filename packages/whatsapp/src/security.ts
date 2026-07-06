const textEncoder = new TextEncoder();

export async function sha256Hex(value: string) {
  return bufferToHex(await crypto.subtle.digest("SHA-256", textEncoder.encode(value)));
}

export async function hmacSha256Hex(input: {
  secret: string;
  value: string;
}) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(input.secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );

  return bufferToHex(
    await crypto.subtle.sign("HMAC", key, textEncoder.encode(input.value)),
  );
}

export function timingSafeEqual(left: string, right: string) {
  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
}

export async function verifyMetaSignature(input: {
  appSecret: string;
  rawBody: string;
  signatureHeader: string | null;
}) {
  if (!input.signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = await hmacSha256Hex({
    secret: input.appSecret,
    value: input.rawBody,
  });
  const received = input.signatureHeader.slice("sha256=".length);

  return timingSafeEqual(expected, received);
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
