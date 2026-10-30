import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canDownload, isValidShareSlug, sanitizeFileName } from "@/lib/access";
import { coverUrl, getFolder, getFolderBySlug, listFolders, listTracks } from "@/lib/repo";
import { ArrowLeftIcon, FolderIcon } from "@/components/Icons";
import { TrackList, type ShareTrack } from "@/components/share/TrackList";
import { DownloadAllButton } from "@/components/share/DownloadAllButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ up?: string }>;
};

async function load(slug: string) {
  if (!isValidShareSlug(slug)) return null;
  return getFolderBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const folder = await load((await params).slug);
  return { title: folder?.name ?? "Dossier introuvable" };
}

export default async function SharePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { up } = await searchParams;
  const folder = await load(slug);
  if (!folder) notFound();

  const [tracks, children, cover] = await Promise.all([
    listTracks(folder.id),
    listFolders(folder.id),
    coverUrl(folder),
  ]);

  // Lien "retour" uniquement si on vient vraiment du dossier parent (on n'expose jamais le parent sinon).
  const parent = up && folder.parent_id && isValidShareSlug(up) ? await getFolder(folder.parent_id) : null;
  const backSlug = parent && parent.share_slug === up ? up : null;

  const downloadable = canDownload(folder);
  const base = `/api/s/${folder.share_slug}/tracks`;
  const shareTracks: ShareTrack[] = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: folder.name,
    src: `${base}/${t.id}`,
    durationSec: t.duration_sec,
    peaks: t.peaks,
    coverUrl: cover,
    bpm: t.bpm,
    musicKey: t.music_key,
    downloadHref: downloadable ? `${base}/${t.id}?mode=download` : null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {backSlug ? (
        <Link href={`/p/${backSlug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-text">
          <ArrowLeftIcon className="size-4" /> Retour
        </Link>
      ) : null}

      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="size-40 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2 sm:size-48">
          {cover ? (
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted">
              <FolderIcon className="size-12" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-medium tracking-widest text-muted uppercase">BeatDrop Project</p>
          <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">{folder.name}</h1>
          {folder.description ? (
            <p className="mt-2 text-sm whitespace-pre-line text-muted">{folder.description}</p>
          ) : null}
          <p className="mt-3 text-xs text-muted">
            {tracks.length} son{tracks.length > 1 ? "s" : ""}
            {children.length > 0 ? ` · ${children.length} dossier${children.length > 1 ? "s" : ""}` : ""}
          </p>
          {downloadable && tracks.length > 0 ? (
            <div className="mt-4">
              <DownloadAllButton
                zipName={sanitizeFileName(folder.name)}
                items={tracks.map((t) => ({ href: `${base}/${t.id}?mode=download`, fileName: t.file_name }))}
              />
            </div>
          ) : null}
        </div>
      </header>

      {children.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-muted">Dossiers</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/p/${child.share_slug}?up=${folder.share_slug}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:bg-surface-2"
              >
                <FolderIcon className="size-5 shrink-0 text-muted" />
                <span className="truncate text-sm">{child.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <TrackList tracks={shareTracks} />
    </main>
  );
}
