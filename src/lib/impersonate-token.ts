import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "";
const EXPIRY_MS = 5 * 60 * 1000; // 5 min

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}
function b64urlDecode(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

export function signImpersonateToken(memberId: string, tenantSlug: string): string {
  const payload = JSON.stringify({
    memberId,
    tenantSlug,
    exp: Date.now() + EXPIRY_MS,
  });
  const payloadB64 = b64urlEncode(Buffer.from(payload, "utf8"));
  const sig = createHmac("sha256", SECRET).update(payloadB64).digest();
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

export function verifyImpersonateToken(
  token: string
): { memberId: string; tenantSlug: string } | null {
  if (!SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = createHmac("sha256", SECRET).update(payloadB64).digest();
  const sig = b64urlDecode(sigB64);
  if (sig.length !== expectedSig.length || !timingSafeEqual(sig, expectedSig)) return null;
  let payload: { memberId: string; tenantSlug: string; exp: number };
  try {
    payload = JSON.parse(Buffer.from(b64urlDecode(payloadB64)).toString("utf8"));
  } catch {
    return null;
  }
  if (Date.now() > payload.exp || !payload.memberId || !payload.tenantSlug) return null;
  return { memberId: payload.memberId, tenantSlug: payload.tenantSlug };
}
