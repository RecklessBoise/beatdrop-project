import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { buildObjectKey, maxBytesFor, resolveContentType } from "@/lib/access";
import { signUploadUrl } from "@/lib/r2";
import { requireFolder } from "@/lib/repo";

const Body = z.object({
  folderId: z.string().uuid(),
  kind: z.enum(["audio", "cover"]),
  fileName: z.string().min(1).max(300),
  size: z.number().int().positive(),
});

/** Donne une URL signée pour envoyer un fichier directement du navigateur vers R2. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const body = Body.parse(await req.json());
  await requireFolder(body.folderId);
  const contentType = resolveContentType(body.kind, body.fileName);
  if (!contentType) throw new HttpError(400, `Format non supporté : ${body.fileName}`);
  if (body.size > maxBytesFor(body.kind)) {
    throw new HttpError(413, `Fichier trop lourd : ${body.fileName}`);
  }
  const key = buildObjectKey(body.kind, body.folderId, body.fileName);
  const url = await signUploadUrl(key, contentType);
  return NextResponse.json({ key, url, contentType });
});
