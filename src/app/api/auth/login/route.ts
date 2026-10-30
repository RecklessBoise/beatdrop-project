import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { passwordMatches } from "@/lib/auth";
import { env } from "@/lib/env";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/session";

const Body = z.object({ password: z.string().min(1).max(200) });

export const POST = handle(async (req: Request) => {
  const { password } = Body.parse(await req.json());
  if (!passwordMatches(password)) {
    // TEMP diagnostic : longueurs seulement, jamais le contenu.
    console.warn(`[login] refus : reçu ${password.trim().length} car., attendu ${env.adminPassword.length} car.`);
    // Ralentit le brute-force sans bloquer l'utilisateur légitime.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
});
