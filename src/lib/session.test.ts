import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { createSessionToken, verifySessionToken } from "./session";

const SECRET = "test-secret-0123456789-abcdefghijklmnop";

describe("session token", () => {
  it("valide un jeton signé avec le bon secret", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejette un autre secret, un jeton absent ou altéré", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, `${SECRET}-other`)).toBe(false);
    expect(await verifySessionToken(undefined, SECRET)).toBe(false);
    expect(await verifySessionToken(`${token}x`, SECRET)).toBe(false);
  });

  it("rejette un jeton expiré ou sans rôle admin", async () => {
    const key = new TextEncoder().encode(SECRET);
    const expired = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(key);
    const notAdmin = await new SignJWT({ role: "client" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(key);
    expect(await verifySessionToken(expired, SECRET)).toBe(false);
    expect(await verifySessionToken(notAdmin, SECRET)).toBe(false);
  });

  it("refuse de signer avec un secret trop court", async () => {
    await expect(createSessionToken("short")).rejects.toThrow(/SESSION_SECRET/);
  });
});
