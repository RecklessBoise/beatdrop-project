"use client";

import { formatDuration } from "@/lib/access";
import { DownloadIcon, PauseIcon, PlayIcon } from "@/components/Icons";
import { usePlayer, type PlayableTrack } from "@/components/player/PlayerProvider";

export type ShareTrack = PlayableTrack & {
  bpm: number | null;
  musicKey: string | null;
  downloadHref: string | null;
};

export function TrackList({ tracks }: { tracks: ShareTrack[] }) {
  const { current, playing, play } = usePlayer();

  if (tracks.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">Aucun son dans ce dossier pour l’instant.</p>;
  }

  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {tracks.map((track, i) => {
        const isCurrent = current?.id === track.id;
        const isPlaying = isCurrent && playing;
        return (
          <li
            key={track.id}
            className={`group flex items-center gap-3 px-3 py-2.5 sm:px-4 ${isCurrent ? "bg-surface-2" : "hover:bg-surface-2/60"}`}
          >
            <button
              onClick={() => play(tracks, i)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              aria-label={isPlaying ? `Pause ${track.title}` : `Lire ${track.title}`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted group-hover:bg-text group-hover:text-bg">
                {isPlaying ? (
                  <PauseIcon className="size-3.5" />
                ) : (
                  <>
                    <span className={`font-mono text-xs tabular-nums group-hover:hidden ${isCurrent ? "text-accent" : ""}`}>
                      {i + 1}
                    </span>
                    <PlayIcon className="hidden size-3.5 translate-x-px group-hover:block" />
                  </>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm ${isCurrent ? "text-accent" : ""}`}>{track.title}</span>
                {track.bpm || track.musicKey ? (
                  <span className="block truncate text-xs text-muted">
                    {[track.bpm ? `${track.bpm} BPM` : null, track.musicKey].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </span>
            </button>
            <span className="font-mono text-xs tabular-nums text-muted">{formatDuration(track.durationSec)}</span>
            {track.downloadHref ? (
              <a
                href={track.downloadHref}
                className="rounded-full p-2 text-muted hover:bg-surface hover:text-text"
                aria-label={`Télécharger ${track.title}`}
                title="Télécharger"
              >
                <DownloadIcon className="size-4" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
