import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteTrack, updateTrack } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

const Patch = z
  .object({
    title: z.string().trim().min(1).max(200),
    bpm: z.number().int().min(20).max(400).nullable(),
    music_key: z.string().trim().max(12).nullable(),
  })
  .partial();

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  return NextResponse.json(await updateTrack(id, Patch.parse(await req.json())));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await deleteTrack(id);
  return NextResponse.json({ ok: true });
});
