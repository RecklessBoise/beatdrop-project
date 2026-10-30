"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function NewFolderForm({
  parentId = null,
  label = "Nouveau dossier",
}: {
  parentId?: string | null;
  label?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    try {
      await api("/api/folders", "POST", { name: name.trim(), parentId });
      setName("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={label}
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          aria-label={label}
        />
        <button className="btn-primary shrink-0" disabled={pending || !name.trim()}>
          Créer
        </button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </form>
  );
}
