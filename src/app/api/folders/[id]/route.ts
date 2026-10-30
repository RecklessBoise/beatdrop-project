import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { keyBelongsToFolder } from "@/lib/access";
import { deleteFolder, updateFolder } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

const Patch = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(2000),
    download_enabled: z.boolean(),
    cover_key: z.string().max(400).nullable(),
  })
  .partial();

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const patch = Patch.parse(await req.json());
  if (patch.cover_key && !keyBelongsToFolder("cover", patch.cover_key, id)) {
    throw new HttpError(400, "Pochette invalide");
  }
  return NextResponse.json(await updateFolder(id, patch));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await deleteFolder(id);
  return NextResponse.json({ ok: true });
});
