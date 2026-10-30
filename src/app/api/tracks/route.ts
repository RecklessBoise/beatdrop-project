import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { keyBelongsToFolder, resolveContentType } from "@/lib/access";
import { createTrack, requireFolder } from "@/lib/repo";

const Body = z.object({
  folderId: z.string().uuid(),
  key: z.string().min(1).max(400),
  fileName: z.string().min(1).max(300),
  title: z.string().trim().min(1).max(200),
  size: z.number().int().nonnegative(),
  durationSec: z.number().nonnegative().max(60 * 60 * 6).nullable(),
  peaks: z.array(z.number().min(0).max(1)).max(2000).nullable(),
});

/** Enregistre un son après son upload réussi vers R2. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const body = Body.parse(await req.json());
  await requireFolder(body.folderId);
  const contentType = resolveContentType("audio", body.fileName);
  if (!contentType || !keyBelongsToFolder("audio", body.key, body.folderId)) {
    throw new HttpError(400, "Fichier invalide");
  }
  const track = await createTrack({
    folder_id: body.folderId,
    title: body.title,
    file_key: body.key,
    file_name: body.fileName,
    content_type: contentType,
    size_bytes: body.size,
    duration_sec: body.durationSec,
    peaks: body.peaks,
  });
  return NextResponse.json(track, { status: 201 });
});
