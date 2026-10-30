"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { titleFromFileName } from "@/lib/access";
import { analyzeAudio, api, isAcceptedAudio, uploadFile } from "@/lib/client-api";
import { UploadIcon } from "@/components/Icons";

type Job = {
  id: string;
  name: string;
  progress: number;
  status: "waiting" | "uploading" | "saving" | "done" | "error";
  error?: string;
};

const CONCURRENCY = 2;

export function Uploader({ folderId }: { folderId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);

  const update = (id: string, patch: Partial<Job>) =>
    setJobs((all) => all.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  async function uploadOne(job: Job, file: File) {
    try {
      update(job.id, { status: "uploading" });
      const analysis = analyzeAudio(file);
      const { key } = await uploadFile(folderId, "audio", file, (progress) => update(job.id, { progress }));
      update(job.id, { status: "saving", progress: 1 });
      const { durationSec, peaks } = await analysis;
      await api("/api/tracks", "POST", {
        folderId,
        key,
        fileName: file.name,
        title: titleFromFileName(file.name),
        size: file.size,
        durationSec,
        peaks,
      });
      update(job.id, { status: "done" });
      router.refresh();
    } catch (err) {
      update(job.id, { status: "error", error: (err as Error).message });
    }
  }

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    const newJobs = files.map<Job>((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      progress: 0,
      status: isAcceptedAudio(f) ? "waiting" : "error",
      error: isAcceptedAudio(f) ? undefined : "Format non supporté",
    }));
    setJobs((all) => [...all.filter((j) => j.status !== "done"), ...newJobs]);
    if (input.current) input.current.value = "";

    const queue = files
      .map((file, i) => ({ file, job: newJobs[i] }))
      .filter(({ job }) => job.status === "waiting");
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        await uploadOne(next.job, next.file);
      }
    });
    await Promise.all(workers);
  }

  const active = jobs.filter((j) => j.status !== "done");

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") input.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-accent bg-accent/5" : "border-line hover:border-muted"
        }`}
      >
        <UploadIcon className="size-6 text-muted" />
        <p className="text-sm">Glisse tes sons ici ou clique pour choisir</p>
        <p className="text-xs text-muted">MP3, WAV, AIFF, FLAC, M4A, OGG · 500 Mo max par fichier</p>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept=".mp3,.wav,.aif,.aiff,.flac,.m4a,.aac,.ogg,audio/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
      />

      {active.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {active.map((job) => (
            <li key={job.id} className="rounded-lg border border-line bg-surface px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{job.name}</span>
                <span className={`shrink-0 text-xs ${job.status === "error" ? "text-danger" : "text-muted"}`}>
                  {job.status === "waiting" && "En attente"}
                  {job.status === "uploading" && `${Math.round(job.progress * 100)} %`}
                  {job.status === "saving" && "Enregistrement…"}
                  {job.status === "error" && (job.error ?? "Erreur")}
                </span>
              </div>
              {job.status === "uploading" || job.status === "saving" ? (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent transition-all" style={{ width: `${job.progress * 100}%` }} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
