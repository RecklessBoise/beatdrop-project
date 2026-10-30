import "server-only";
import type { Folder } from "./db";
import { countTracksByFolder, coverUrl } from "./repo";

export async function withCardData(folders: Folder[]) {
  const counts = await countTracksByFolder(folders.map((f) => f.id));
  return Promise.all(
    folders.map(async (f) => ({ ...f, cover: await coverUrl(f), trackCount: counts[f.id] ?? 0 })),
  );
}
