export type PasswordHash = `pbkdf2_sha256$${number}$${string}$${string}`;

const passwordIterations = 150_000;
const sessionDays = 14;
const resetMinutes = 30;

export function createSessionToken() {
  return `tos_session_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function createPasswordResetToken() {
  return `tos_reset_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function createPasswordResetId() {
  return `pwr_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

export function createSessionId() {
  return `ses_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

export function sessionExpiresAt(now = new Date()) {
  return new Date(now.getTime() + sessionDays * 24 * 60 * 60 * 1000);
}

export function resetExpiresAt(now = new Date()) {
  return new Date(now.getTime() + resetMinutes * 60 * 1000);
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePassword(password, salt, passwordIterations);

  return `pbkdf2_sha256$${passwordIterations}$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyPassword(input: {
  password: string;
  storedHash: string;
}) {
  const [algorithm, iterationText, saltHex, hashHex] =
    input.storedHash.split("$");
  const iterations = Number(iterationText);

  if (
    algorithm !== "pbkdf2_sha256" ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    !saltHex ||
    !hashHex
  ) {
    return false;
  }

  const salt = fromHex(saltHex);
  const expected = fromHex(hashHex);
  const derived = await derivePassword(input.password, salt, iterations);

  return timingSafeEqual(derived, expected);
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return toHex(new Uint8Array(digest));
}

async function derivePassword(
  password: string,
  salt: Uint8Array,
  iterations: number,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      iterations,
      name: "PBKDF2",
      salt: salt as BufferSource,
    },
    key,
    256,
  );

  return new Uint8Array(bits);
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    mismatch |= left[index]! ^ right[index]!;
  }

  return mismatch === 0;
}

function toHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  if (value.length % 2 !== 0 || /[^a-f0-9]/i.test(value)) {
    return new Uint8Array();
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}
