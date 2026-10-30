import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export function passwordMatches(candidate: string, expected = env.adminPassword): boolean {
  const a = Buffer.from(candidate.trim().normalize("NFC"));
  const b = Buffer.from(expected.normalize("NFC"));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Non autorisé");
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new UnauthorizedError();
}
