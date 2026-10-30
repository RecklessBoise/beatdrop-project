import { NextResponse } from "next/server";
import { canDownload, isValidShareSlug } from "@/lib/access";
import { handle, HttpError } from "@/lib/api";
import { signDownloadUrl, signStreamUrl } from "@/lib/r2";
import { getFolderBySlug, getTrack } from "@/lib/repo";

type Ctx = { params: Promise<{ slug: string; trackId: string }> };

/**
 * Accès public à un son via le lien de partage du dossier.
 *   ?mode=stream   (défaut) -> lecture
 *   ?mode=download          -> téléchargement, refusé si le dossier l'a désactivé
 */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { slug, trackId } = await params;
  const mode = new URL(req.url).searchParams.get("mode") ?? "stream";
  if (!isValidShareSlug(slug) || !/^[0-9a-f-]{36}$/i.test(trackId)) {
    throw new HttpError(404, "Introuvable");
  }
  const folder = await getFolderBySlug(slug);
  const track = folder ? await getTrack(trackId) : null;
  if (!folder || !track || track.folder_id !== folder.id) throw new HttpError(404, "Introuvable");

  if (mode === "download") {
    if (!canDownload(folder)) {
      throw new HttpError(403, "Le téléchargement est désactivé pour ce dossier");
    }
    return NextResponse.redirect(await signDownloadUrl(track.file_key, track.file_name), 302);
  }
  const res = NextResponse.redirect(await signStreamUrl(track.file_key), 302);
  res.headers.set("Cache-Control", "private, max-age=300");
  return res;
});
