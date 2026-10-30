"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Folder } from "@/lib/db";
import { api, uploadFile } from "@/lib/client-api";
import { ExternalIcon, FolderIcon, LinkIcon, TrashIcon } from "@/components/Icons";

type Props = { folder: Folder; cover: string | null };

export function FolderSettings({ folder, cover }: Props) {
  const router = useRouter();
  const coverInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description);
  const [downloadEnabled, setDownloadEnabled] = useState(folder.download_enabled);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sharePath = `/p/${folder.share_slug}`;

  async function patch(body: Partial<Folder>, label: string) {
    setBusy(label);
    setError(null);
    try {
      await api(`/api/folders/${folder.id}`, "PATCH", body);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setBusy(null);
    }
  }

  async function toggleDownload() {
    const next = !downloadEnabled;
    setDownloadEnabled(next);
    await patch({ download_enabled: next }, "download").catch(() => setDownloadEnabled(!next));
  }

  async function onCover(file: File | undefined) {
    if (!file) return;
    setBusy("cover");
    setError(null);
    try {
      const { key } = await uploadFile(folder.id, "cover", file);
      await api(`/api/folders/${folder.id}`, "PATCH", { cover_key: key });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
      if (coverInput.current) coverInput.current.value = "";
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function regenerate() {
    if (!confirm("Générer un nouveau lien ? L’ancien lien ne fonctionnera plus.")) return;
    setBusy("link");
    try {
      await api(`/api/folders/${folder.id}/regenerate-link`, "POST");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`Supprimer « ${folder.name} », ses sous-dossiers et tous leurs sons ? C’est définitif.`)) return;
    setBusy("delete");
    try {
      await api(`/api/folders/${folder.id}`, "DELETE");
      router.replace(folder.parent_id ? `/admin/folders/${folder.parent_id}` : "/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-6 sm:flex-row">
      <button
        type="button"
        onClick={() => coverInput.current?.click()}
        className="group relative size-40 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2 sm:size-48"
        aria-label="Changer la pochette"
        disabled={busy === "cover"}
      >
        {cover ? (
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-muted">
            <FolderIcon className="size-12" />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium opacity-0 transition group-hover:opacity-100">
          {busy === "cover" ? "Envoi…" : "Changer la pochette"}
        </span>
      </button>
      <input
        ref={coverInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onCover(e.target.files?.[0])}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <input
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none focus:underline sm:text-3xl"
          value={name}
          maxLength={120}
          aria-label="Nom du dossier"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const trimmed = name.trim();
            if (!trimmed) setName(folder.name);
            else if (trimmed !== folder.name) patch({ name: trimmed }, "name").catch(() => {});
          }}
        />
        <textarea
          className="input min-h-16 resize-y"
          placeholder="Description visible par tes clients (optionnel)"
          value={description}
          maxLength={2000}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== folder.description) patch({ description }, "description").catch(() => {});
          }}
        />

        <div className="flex items-center gap-3 self-start">
          <button
            type="button"
            role="switch"
            aria-checked={downloadEnabled}
            aria-label="Autoriser le téléchargement"
            onClick={toggleDownload}
            disabled={busy === "download"}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${downloadEnabled ? "bg-accent" : "bg-line"}`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full shadow transition-all ${downloadEnabled ? "left-5.5 bg-accent-ink" : "left-0.5 bg-text"}`}
            />
          </button>
          <span className="text-sm">
            Téléchargement{" "}
            <strong className={downloadEnabled ? "text-accent" : "text-muted"}>
              {downloadEnabled ? "actif" : "inactif"}
            </strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copyLink} className="btn-primary">
            <LinkIcon className="size-4" />
            {copied ? "Lien copié !" : "Copier le lien client"}
          </button>
          <a href={sharePath} target="_blank" rel="noreferrer" className="btn-ghost">
            <ExternalIcon className="size-4" /> Voir comme un client
          </a>
          <button type="button" onClick={regenerate} disabled={busy === "link"} className="btn-ghost">
            Nouveau lien
          </button>
          <button type="button" onClick={remove} disabled={busy === "delete"} className="btn-danger">
            <TrashIcon className="size-4" /> Supprimer
          </button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </section>
  );
}
