"use client";

import { formatDuration } from "@/lib/access";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from "@/components/Icons";
import { usePlayer, usePlayerTime } from "./PlayerProvider";
import { Waveform } from "./Waveform";

export function PlayerBar() {
  const { current, playing, toggle, next, prev, seek, index, queue } = usePlayer();
  const { time, duration } = usePlayerTime();
  if (!current) return null;

  const total = duration || current.durationSec || 0;
  const progress = total > 0 ? time / total : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-5">
        {current.coverUrl ? (
          <img src={current.coverUrl} alt="" className="hidden size-12 rounded-md object-cover sm:block" />
        ) : null}
        <div className="w-28 min-w-0 shrink-0 sm:w-44">
          <p className="truncate text-sm font-medium">{current.title}</p>
          <p className="truncate text-xs text-muted">
            {current.subtitle ?? `${index + 1} / ${queue.length}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button onClick={prev} className="rounded-full p-2 text-muted hover:text-text" aria-label="Précédent">
            <PrevIcon className="size-4" />
          </button>
          <button
            onClick={toggle}
            className="flex size-10 items-center justify-center rounded-full bg-text text-bg hover:scale-105"
            aria-label={playing ? "Pause" : "Lecture"}
          >
            {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4 translate-x-px" />}
          </button>
          <button
            onClick={next}
            disabled={index + 1 >= queue.length}
            className="rounded-full p-2 text-muted hover:text-text disabled:opacity-30"
            aria-label="Suivant"
          >
            <NextIcon className="size-4" />
          </button>
        </div>

        <span className="hidden w-10 text-right font-mono text-xs tabular-nums text-muted sm:block">
          {formatDuration(time)}
        </span>
        <Waveform peaks={current.peaks} progress={progress} onSeek={(r) => seek(r * total)} className="h-9 min-w-0 flex-1" />
        <span className="hidden w-10 font-mono text-xs tabular-nums text-muted sm:block">
          {formatDuration(total)}
        </span>
      </div>
    </div>
  );
}
