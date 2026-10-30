import { describe, expect, it } from "vitest";
import {
  buildObjectKey,
  canDownload,
  computePeaks,
  contentDisposition,
  formatDuration,
  isValidShareSlug,
  keyBelongsToFolder,
  maxBytesFor,
  newShareSlug,
  resolveContentType,
  sanitizeFileName,
  titleFromFileName,
} from "./access";

const FOLDER = "3f1c2a9e-1111-4222-8333-444455556666";

describe("canDownload", () => {
  it("n'autorise que si download_enabled vaut exactement true", () => {
    expect(canDownload({ download_enabled: true })).toBe(true);
    expect(canDownload({ download_enabled: false })).toBe(false);
    expect(canDownload(null)).toBe(false);
    expect(canDownload(undefined)).toBe(false);
  });
});

describe("share slug", () => {
  it("génère des slugs valides et uniques", () => {
    const slugs = new Set(Array.from({ length: 500 }, newShareSlug));
    expect(slugs.size).toBe(500);
    for (const s of slugs) expect(isValidShareSlug(s)).toBe(true);
  });

  it("rejette les slugs malformés", () => {
    expect(isValidShareSlug("")).toBe(false);
    expect(isValidShareSlug("short")).toBe(false);
    expect(isValidShareSlug("../../etc/passwd")).toBe(false);
    expect(isValidShareSlug("abcdefghijklmnop!")).toBe(false);
  });
});

describe("resolveContentType", () => {
  it("accepte les formats audio courants, insensible à la casse", () => {
    expect(resolveContentType("audio", "beat.MP3")).toBe("audio/mpeg");
    expect(resolveContentType("audio", "beat.wav")).toBe("audio/wav");
    expect(resolveContentType("audio", "beat.aiff")).toBe("audio/aiff");
  });

  it("refuse les autres fichiers", () => {
    expect(resolveContentType("audio", "virus.exe")).toBeNull();
    expect(resolveContentType("audio", "noext")).toBeNull();
    expect(resolveContentType("audio", "cover.png")).toBeNull();
    expect(resolveContentType("cover", "beat.mp3")).toBeNull();
    expect(resolveContentType("cover", "cover.webp")).toBe("image/webp");
  });

  it("limite la taille par type", () => {
    expect(maxBytesFor("audio")).toBeGreaterThan(maxBytesFor("cover"));
  });
});

describe("object keys", () => {
  it("préfixe par type et dossier, nom assaini", () => {
    const key = buildObjectKey("audio", FOLDER, "Mon Beat (été) #1.wav");
    expect(key.startsWith(`audio/${FOLDER}/`)).toBe(true);
    expect(key).toMatch(/-Mon-Beat-ete-1\.wav$/);
    expect(keyBelongsToFolder("audio", key, FOLDER)).toBe(true);
  });

  it("refuse une clé d'un autre dossier ou d'un autre type", () => {
    const key = buildObjectKey("audio", FOLDER, "a.mp3");
    expect(keyBelongsToFolder("audio", key, "other")).toBe(false);
    expect(keyBelongsToFolder("cover", key, FOLDER)).toBe(false);
    expect(keyBelongsToFolder("audio", `audio/${FOLDER}/../x`, FOLDER)).toBe(false);
  });
});

describe("sanitizeFileName", () => {
  it("retire les chemins et caractères spéciaux", () => {
    expect(sanitizeFileName("../../secret/é à.mp3")).toBe("e-a.mp3");
    expect(sanitizeFileName("C:\\Users\\beat.wav")).toBe("beat.wav");
    expect(sanitizeFileName("???")).toBe("fichier");
  });
});

describe("titleFromFileName", () => {
  it("retire l'extension et les underscores", () => {
    expect(titleFromFileName("Dark_Trap_140bpm.wav")).toBe("Dark Trap 140bpm");
    expect(titleFromFileName(".wav")).toBe(".wav");
    expect(titleFromFileName("")).toBe("Sans titre");
  });
});

describe("contentDisposition", () => {
  it("force le téléchargement avec un nom encodé", () => {
    const h = contentDisposition('Été "fire".wav');
    expect(h.startsWith("attachment;")).toBe(true);
    expect(h).toContain('filename="_t_ _fire_.wav"');
    expect(h).toContain("filename*=UTF-8''%C3%89t%C3%A9%20%22fire%22.wav");
  });
});

describe("formatDuration", () => {
  it("formate en m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65.4)).toBe("1:05");
    expect(formatDuration(null)).toBe("--:--");
    expect(formatDuration(Number.NaN)).toBe("--:--");
  });
});

describe("computePeaks", () => {
  it("normalise entre 0 et 1 avec le bon nombre de points", () => {
    const samples = Float32Array.from({ length: 1000 }, (_, i) => Math.sin(i / 10) * (i / 1000));
    const peaks = computePeaks(samples, 100);
    expect(peaks).toHaveLength(100);
    expect(Math.max(...peaks)).toBe(1);
    expect(Math.min(...peaks)).toBeGreaterThanOrEqual(0);
  });

  it("gère le silence et l'entrée vide", () => {
    expect(computePeaks(new Float32Array(0))).toEqual([]);
    expect(computePeaks(new Float32Array(50), 10)).toEqual(Array(10).fill(0));
  });
});
