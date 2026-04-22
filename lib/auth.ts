import { createHmac, timingSafeEqual } from "node:crypto";

const ACCESS_COOKIE_NAME = "ghsa_access";
const COOKIE_TTL_DAYS = 30;

function getSigningSecret(): string {
  return process.env.ACCESS_COOKIE_SECRET ?? "local-dev-secret-change-in-production";
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

export function createAccessCookieValue(email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + COOKIE_TTL_DAYS * 24 * 60 * 60;
  const payload = JSON.stringify({ email: email.trim().toLowerCase(), iat: now, exp });
  const encoded = toBase64Url(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyAccessCookieValue(cookieValue: string | undefined): string | null {
  if (!cookieValue) {
    return null;
  }

  const [encodedPayload, receivedSignature] = cookieValue.split(".");

  if (!encodedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);

  if (received.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as {
      email: string;
      exp: number;
    };

    if (!payload.email || typeof payload.exp !== "number") {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      return null;
    }

    return payload.email;
  } catch {
    return null;
  }
}

export { ACCESS_COOKIE_NAME };
