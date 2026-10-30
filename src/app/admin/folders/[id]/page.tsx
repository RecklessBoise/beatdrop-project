import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coverUrl, getBreadcrumb, getFolder, listFolders, listTracks } from "@/lib/repo";
import { withCardData } from "@/lib/folder-cards";
import { FolderSettings } from "@/components/admin/FolderSettings";
import { Uploader } from "@/components/admin/Uploader";
import { AdminTrackList } from "@/components/admin/AdminTrackList";
import { FolderGrid } from "@/components/admin/FolderGrid";
import { NewFolderForm } from "@/components/admin/NewFolderForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const folder = UUID.test(id) ? await getFolder(id) : null;
  return { title: folder?.name ?? "Dossier" };
}

export default async function AdminFolderPage({ params }: Props) {
  const { id } = await params;
  const folder = UUID.test(id) ? await getFolder(id) : null;
  if (!folder) notFound();

  const [breadcrumb, tracks, children, cover] = await Promise.all([
    getBreadcrumb(folder),
    listTracks(folder.id),
    listFolders(folder.id).then(withCardData),
    coverUrl(folder),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted" aria-label="Fil d’Ariane">
        <Link href="/admin" className="hover:text-text">
          Mes dossiers
        </Link>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <span aria-hidden>/</span>
            {f.id === folder.id ? (
              <span className="text-text">{f.name}</span>
            ) : (
              <Link href={`/admin/folders/${f.id}`} className="hover:text-text">
                {f.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* key : réinitialise les champs si le dossier change côté serveur */}
      <FolderSettings key={folder.updated_at} folder={folder} cover={cover} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          Sons <span className="text-sm font-normal text-muted">({tracks.length})</span>
        </h2>
        <Uploader folderId={folder.id} />
        <AdminTrackList folderName={folder.name} shareSlug={folder.share_slug} tracks={tracks} cover={cover} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">
            Sous-dossiers <span className="text-sm font-normal text-muted">({children.length})</span>
          </h2>
          <div className="w-full sm:w-80">
            <NewFolderForm parentId={folder.id} label="Nouveau sous-dossier" />
          </div>
        </div>
        <FolderGrid folders={children} />
      </section>
    </main>
  );
}
