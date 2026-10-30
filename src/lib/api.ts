import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Enveloppe un handler de route : erreurs connues -> JSON propre, le reste -> 500 loggué. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return NextResponse.json({ error: err.message }, { status: 401 });
      }
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Données invalides", issues: err.issues },
          { status: 400 },
        );
      }
      console.error("[api]", err);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  };
}

/** Lève une HttpError si Supabase renvoie une erreur. */
export function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) {
    console.error("[db]", result.error.message);
    throw new HttpError(500, "Erreur base de données");
  }
  return result.data;
}
