"use client";

import { useState } from "react";
import { downloadZip } from "client-zip";
import { DownloadIcon } from "@/components/Icons";

type Item = { href: string; fileName: string };

export function DownloadAllButton({ items, zipName }: { items: Item[]; zipName: string }) {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    try {
      const files: { name: string; input: Response }[] = [];
      const used = new Set<string>();
      for (const [i, item] of items.entries()) {
        setProgress(`${i + 1}/${items.length}`);
        const res = await fetch(item.href);
        if (!res.ok) throw new Error(`Échec sur ${item.fileName}`);
        let name = item.fileName;
        for (let n = 2; used.has(name); n++) name = `${n}-${item.fileName}`;
        used.add(name);
        files.push({ name, input: res });
      }
      setProgress("Création du ZIP…");
      const blob = await downloadZip(files).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${zipName}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error(err);
      setError("Le téléchargement groupé a échoué. Télécharge les sons un par un.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button onClick={run} disabled={progress !== null || items.length === 0} className="btn-ghost">
        <DownloadIcon className="size-4" />
        {progress ? `Préparation ${progress}` : "Tout télécharger (.zip)"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
