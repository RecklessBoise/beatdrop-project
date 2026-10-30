import "server-only";
import { check, HttpError } from "./api";
import { db, type Folder, type Track } from "./db";
import { newShareSlug } from "./access";
import { deleteObjects, signStreamUrl } from "./r2";

export async function listFolders(parentId: string | null): Promise<Folder[]> {
  let query = db().from("folders").select("*");
  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  return check(await query.order("position").order("created_at", { ascending: false })) ?? [];
}

export async function getFolder(id: string): Promise<Folder | null> {
  return check(await db().from("folders").select("*").eq("id", id).maybeSingle());
}

export async function getFolderBySlug(slug: string): Promise<Folder | null> {
  return check(await db().from("folders").select("*").eq("share_slug", slug).maybeSingle());
}

export async function requireFolder(id: string): Promise<Folder> {
  const folder = await getFolder(id);
  if (!folder) throw new HttpError(404, "Dossier introuvable");
  return folder;
}

export async function countTracksByFolder(folderIds: string[]): Promise<Record<string, number>> {
  if (folderIds.length === 0) return {};
  const rows = check(
    await db().from("tracks").select("folder_id").in("folder_id", folderIds),
  ) as { folder_id: string }[];
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) counts[row.folder_id] = (counts[row.folder_id] ?? 0) + 1;
  return counts;
}

/** Chemin du dossier racine jusqu'au dossier donné (inclus). */
export async function getBreadcrumb(folder: Folder): Promise<Folder[]> {
  const path: Folder[] = [folder];
  let current = folder;
  for (let depth = 0; current.parent_id && depth < 32; depth++) {
    const parent = await getFolder(current.parent_id);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  return path;
}

export async function createFolder(input: { name: string; parentId: string | null }) {
  if (input.parentId) await requireFolder(input.parentId);
  return check(
    await db()
      .from("folders")
      .insert({ name: input.name, parent_id: input.parentId, share_slug: newShareSlug() })
      .select("*")
      .single(),
  ) as Folder;
}

export async function updateFolder(
  id: string,
  patch: Partial<Pick<Folder, "name" | "description" | "download_enabled" | "cover_key" | "share_slug">>,
): Promise<Folder> {
  const before = await requireFolder(id);
  const updated = check(
    await db().from("folders").update(patch).eq("id", id).select("*").single(),
  ) as Folder;
  if (patch.cover_key !== undefined && before.cover_key && before.cover_key !== patch.cover_key) {
    await deleteObjects([before.cover_key]).catch((err) =>
      console.error("[r2] suppression ancienne pochette", err),
    );
  }
  return updated;
}

async function descendantFolderIds(rootId: string): Promise<string[]> {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const children = check(
      await db().from("folders").select("id").in("parent_id", frontier),
    ) as { id: string }[];
    frontier = (children ?? []).map((c) => c.id);
    ids.push(...frontier);
  }
  return ids;
}

/** Supprime le dossier, ses sous-dossiers, leurs sons et les fichiers R2 associés. */
export async function deleteFolder(id: string): Promise<void> {
  await requireFolder(id);
  const ids = await descendantFolderIds(id);
  const folders = check(
    await db().from("folders").select("cover_key").in("id", ids),
  ) as { cover_key: string | null }[];
  const tracks = check(
    await db().from("tracks").select("file_key").in("folder_id", ids),
  ) as { file_key: string }[];
  const keys = [
    ...(folders ?? []).map((f) => f.cover_key ?? ""),
    ...(tracks ?? []).map((t) => t.file_key),
  ];
  check(await db().from("folders").delete().eq("id", id));
  await deleteObjects(keys).catch((err) => console.error("[r2] suppression fichiers", err));
}

export async function listTracks(folderId: string): Promise<Track[]> {
  return (
    check(
      await db()
        .from("tracks")
        .select("*")
        .eq("folder_id", folderId)
        .order("position")
        .order("created_at"),
    ) ?? []
  );
}

export async function getTrack(id: string): Promise<Track | null> {
  return check(await db().from("tracks").select("*").eq("id", id).maybeSingle());
}

export async function createTrack(
  input: Omit<Track, "id" | "created_at" | "position" | "bpm" | "music_key">,
): Promise<Track> {
  const last = check(
    await db()
      .from("tracks")
      .select("position")
      .eq("folder_id", input.folder_id)
      .order("position", { ascending: false })
      .limit(1),
  ) as { position: number }[];
  const position = (last?.[0]?.position ?? -1) + 1;
  return check(
    await db()
      .from("tracks")
      .insert({ ...input, position })
      .select("*")
      .single(),
  ) as Track;
}

export async function updateTrack(
  id: string,
  patch: Partial<Pick<Track, "title" | "bpm" | "music_key">>,
): Promise<Track> {
  const track = check(
    await db().from("tracks").update(patch).eq("id", id).select("*").maybeSingle(),
  ) as Track | null;
  if (!track) throw new HttpError(404, "Son introuvable");
  return track;
}

export async function deleteTrack(id: string): Promise<void> {
  const track = await getTrack(id);
  if (!track) throw new HttpError(404, "Son introuvable");
  check(await db().from("tracks").delete().eq("id", id));
  await deleteObjects([track.file_key]).catch((err) => console.error("[r2] suppression son", err));
}

export async function reorderTracks(folderId: string, trackIds: string[]): Promise<void> {
  const existing = await listTracks(folderId);
  const known = new Set(existing.map((t) => t.id));
  if (trackIds.length !== known.size || !trackIds.every((id) => known.has(id))) {
    throw new HttpError(400, "Liste de sons incohérente avec le dossier");
  }
  await Promise.all(
    trackIds.map(async (id, position) =>
      check(await db().from("tracks").update({ position }).eq("id", id)),
    ),
  );
}

export async function coverUrl(folder: Pick<Folder, "cover_key">): Promise<string | null> {
  return folder.cover_key ? signStreamUrl(folder.cover_key) : null;
}
