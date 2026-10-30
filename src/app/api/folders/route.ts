import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createFolder } from "@/lib/repo";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().nullable().optional(),
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const body = Body.parse(await req.json());
  const folder = await createFolder({ name: body.name, parentId: body.parentId ?? null });
  return NextResponse.json(folder, { status: 201 });
});
