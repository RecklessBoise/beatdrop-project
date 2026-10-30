import type { Metadata } from "next";
import { listFolders } from "@/lib/repo";
import { withCardData } from "@/lib/folder-cards";
import { FolderGrid } from "@/components/admin/FolderGrid";
import { NewFolderForm } from "@/components/admin/NewFolderForm";

export const metadata: Metadata = { title: "Mes dossiers" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const folders = await withCardData(await listFolders(null));
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes dossiers</h1>
          <p className="text-sm text-muted">
            {folders.length} dossier{folders.length > 1 ? "s" : ""} · aucune limite
          </p>
        </div>
        <div className="w-full sm:w-96">
          <NewFolderForm />
        </div>
      </div>
      <FolderGrid folders={folders} />
    </main>
  );
}
