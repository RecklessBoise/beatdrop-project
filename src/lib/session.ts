// Edge-safe (utilisé par le middleware) : pas d'import "server-only" ni de Node API.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bd_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function secretKey(secret: string | undefined): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(secret = process.env.SESSION_SECRET): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secretKey(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret = process.env.SESSION_SECRET,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
