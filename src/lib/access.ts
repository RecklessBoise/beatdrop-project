// Logique pure (sans I/O) : partagée serveur/client et couverte par les tests unitaires.
import { customAlphabet, nanoid } from "nanoid";

export const MAX_AUDIO_BYTES = 500 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aif: "audio/aiff",
  aiff: "audio/aiff",
  flac: "audio/flac",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
};

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type UploadKind = "audio" | "cover";

const slugAlphabet = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  16,
);

/** Slug de partage non devinable (~95 bits d'entropie). */
export function newShareSlug(): string {
  return slugAlphabet();
}

export function isValidShareSlug(slug: string): boolean {
  return /^[0-9a-zA-Z]{16}$/.test(slug);
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/** Renvoie le content-type normalisé si le fichier est accepté, sinon null. */
export function resolveContentType(kind: UploadKind, fileName: string): string | null {
  const table = kind === "audio" ? AUDIO_TYPES : IMAGE_TYPES;
  return table[extensionOf(fileName)] ?? null;
}

export function maxBytesFor(kind: UploadKind): number {
  return kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return (cleaned || "fichier").slice(0, 120);
}

export function buildObjectKey(kind: UploadKind, folderId: string, fileName: string): string {
  const prefix = kind === "audio" ? "audio" : "covers";
  return `${prefix}/${folderId}/${nanoid(10)}-${sanitizeFileName(fileName)}`;
}

/** Une clé d'objet n'est acceptée que si elle a été générée pour ce dossier. */
export function keyBelongsToFolder(kind: UploadKind, key: string, folderId: string): boolean {
  const prefix = kind === "audio" ? "audio" : "covers";
  return key.startsWith(`${prefix}/${folderId}/`) && !key.includes("..");
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const dot = base.lastIndexOf(".");
  const title = (dot > 0 ? base.slice(0, dot) : base).replace(/[_]+/g, " ").trim();
  return (title || "Sans titre").slice(0, 200);
}

export function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/** Règle centrale : le téléchargement n'est possible que si le dossier l'autorise. */
export function canDownload(folder: { download_enabled: boolean } | null | undefined): boolean {
  return folder?.download_enabled === true;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Réduit des échantillons audio en `count` pics normalisés (0..1) pour la forme d'onde. */
export function computePeaks(samples: ArrayLike<number>, count = 600): number[] {
  if (samples.length === 0 || count <= 0) return [];
  const size = Math.max(1, Math.floor(samples.length / count));
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < count; i++) {
    const start = i * size;
    if (start >= samples.length) break;
    const end = Math.min(samples.length, start + size);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(samples[j]);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  return max > 0 ? peaks.map((p) => Math.round((p / max) * 1000) / 1000) : peaks;
}
