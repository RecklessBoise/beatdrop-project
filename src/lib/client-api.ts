// Appels API côté navigateur (espace admin).
import { computePeaks, resolveContentType } from "./access";

export async function api<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Erreur ${res.status}`);
  return data as T;
}

type Signed = { key: string; url: string; contentType: string };

function putWithProgress(url: string, file: File, contentType: string, onProgress: (r: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload refusé par le stockage (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload impossible (réseau ou CORS du bucket R2)"));
    xhr.send(file);
  });
}

export async function uploadFile(
  folderId: string,
  kind: "audio" | "cover",
  file: File,
  onProgress: (ratio: number) => void = () => {},
): Promise<Signed> {
  const signed = await api<Signed>("/api/uploads", "POST", {
    folderId,
    kind,
    fileName: file.name,
    size: file.size,
  });
  await putWithProgress(signed.url, file, signed.contentType, onProgress);
  return signed;
}

const MAX_DECODE_BYTES = 250 * 1024 * 1024;

function durationFromMetadata(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

/** Durée + pics de forme d'onde, calculés dans le navigateur pour éviter tout traitement serveur. */
export async function analyzeAudio(file: File): Promise<{ durationSec: number | null; peaks: number[] | null }> {
  if (file.size <= MAX_DECODE_BYTES) {
    try {
      const ctx = new OfflineAudioContext(1, 1, 44100);
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      return { durationSec: buffer.duration, peaks: computePeaks(buffer.getChannelData(0), 600) };
    } catch (err) {
      console.warn("Décodage impossible, forme d'onde ignorée", file.name, err);
    }
  }
  return { durationSec: await durationFromMetadata(file), peaks: null };
}

export function isAcceptedAudio(file: File): boolean {
  return resolveContentType("audio", file.name) !== null;
}
