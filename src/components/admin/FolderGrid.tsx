import Link from "next/link";
import type { Folder } from "@/lib/db";
import { FolderIcon } from "@/components/Icons";

type Item = Folder & { cover: string | null; trackCount: number };

export function FolderGrid({ folders }: { folders: Item[] }) {
  if (folders.length === 0) {
    return <p className="py-8 text-sm text-muted">Aucun dossier pour l’instant.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {folders.map((f) => (
        <Link key={f.id} href={`/admin/folders/${f.id}`} className="group flex flex-col gap-2">
          <div className="aspect-square overflow-hidden rounded-xl border border-line bg-surface-2 transition group-hover:border-muted">
            {f.cover ? (
              <img src={f.cover} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted">
                <FolderIcon className="size-10" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{f.name}</p>
            <p className="truncate text-xs text-muted">
              {f.trackCount} son{f.trackCount > 1 ? "s" : ""} ·{" "}
              <span className={f.download_enabled ? "text-accent" : ""}>
                {f.download_enabled ? "Téléchargement actif" : "Écoute seule"}
              </span>
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
