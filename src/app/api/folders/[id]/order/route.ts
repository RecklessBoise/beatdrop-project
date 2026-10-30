import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { reorderTracks } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({ trackIds: z.array(z.string().uuid()).max(5000) });

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const { trackIds } = Body.parse(await req.json());
  await reorderTracks(id, trackIds);
  return NextResponse.json({ ok: true });
});
