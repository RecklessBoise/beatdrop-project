"use client";

import { useId, useMemo } from "react";

const BARS = 140;

function resample(peaks: number[] | null, bars: number): number[] {
  if (!peaks || peaks.length === 0) return Array(bars).fill(0.12);
  return Array.from({ length: bars }, (_, i) => {
    const start = Math.floor((i * peaks.length) / bars);
    const end = Math.max(start + 1, Math.floor(((i + 1) * peaks.length) / bars));
    let max = 0;
    for (let j = start; j < end && j < peaks.length; j++) max = Math.max(max, peaks[j]);
    return Math.max(0.06, max);
  });
}

type Props = {
  peaks: number[] | null;
  progress: number;
  onSeek?: (ratio: number) => void;
  className?: string;
};

/** Forme d'onde SVG à partir des pics pré-calculés à l'upload (aucun téléchargement du fichier). */
export function Waveform({ peaks, progress, onSeek, className = "h-10" }: Props) {
  const clipId = useId();
  const bars = useMemo(() => resample(peaks, BARS), [peaks]);
  const pct = Math.min(1, Math.max(0, progress)) * 100;

  const rects = bars.map((h, i) => (
    <rect key={i} x={i * 3} y={(1 - h) * 20} width={2} height={Math.max(1, h * 40)} rx={1} />
  ));

  return (
    <div
      className={`relative w-full ${onSeek ? "cursor-pointer" : ""} ${className}`}
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? "Position de lecture" : undefined}
      aria-valuenow={onSeek ? Math.round(pct) : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      tabIndex={onSeek ? 0 : undefined}
      onClick={(e) => {
        if (!onSeek) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek((e.clientX - rect.left) / rect.width);
      }}
      onKeyDown={(e) => {
        if (!onSeek) return;
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
      }}
    >
      <svg
        viewBox={`0 0 ${BARS * 3} 40`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={(BARS * 3 * pct) / 100} height={40} />
          </clipPath>
        </defs>
        <g fill="var(--border)">{rects}</g>
        <g fill="var(--accent)" clipPath={`url(#${clipId})`}>
          {rects}
        </g>
      </svg>
    </div>
  );
}
