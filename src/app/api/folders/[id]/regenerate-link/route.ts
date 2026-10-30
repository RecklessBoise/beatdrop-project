import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { newShareSlug } from "@/lib/access";
import { updateFolder } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

/** Révoque l'ancien lien de partage en générant un nouveau slug. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  return NextResponse.json(await updateFolder(id, { share_slug: newShareSlug() }));
});
