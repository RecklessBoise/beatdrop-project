"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlayableTrack = {
  id: string;
  title: string;
  subtitle?: string;
  src: string;
  durationSec: number | null;
  peaks: number[] | null;
  coverUrl?: string | null;
};

type PlayerState = {
  queue: PlayableTrack[];
  index: number;
  current: PlayableTrack | null;
  playing: boolean;
  /** Lance `queue[index]`. Si c'est déjà le son en cours, bascule lecture/pause. */
  play: (queue: PlayableTrack[], index: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
};

type TimeState = { time: number; duration: number };

const PlayerContext = createContext<PlayerState | null>(null);
const TimeContext = createContext<TimeState>({ time: 0, duration: 0 });

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer doit être utilisé dans <PlayerProvider>");
  return ctx;
}

export function usePlayerTime(): TimeState {
  return useContext(TimeContext);
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retriedRef = useRef<string | null>(null);
  const [queue, setQueue] = useState<PlayableTrack[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState<TimeState>({ time: 0, duration: 0 });

  const current = index >= 0 ? (queue[index] ?? null) : null;

  const start = useCallback((track: PlayableTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.src;
    setTime({ time: 0, duration: track.durationSec ?? 0 });
    audio.play().catch(() => setPlaying(false));
  }, []);

  const play = useCallback(
    (nextQueue: PlayableTrack[], nextIndex: number) => {
      const audio = audioRef.current;
      const track = nextQueue[nextIndex];
      if (!audio || !track) return;
      if (current && current.id === track.id) {
        if (audio.paused) audio.play().catch(() => setPlaying(false));
        else audio.pause();
        return;
      }
      setQueue(nextQueue);
      setIndex(nextIndex);
      start(track);
    },
    [current, start],
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      const track = queue[nextIndex];
      if (!track) return;
      setIndex(nextIndex);
      start(track);
    },
    [queue, start],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [current]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    // Comme sur la plupart des lecteurs : après 3 s, "précédent" revient au début du son.
    if (audio && audio.currentTime > 3) audio.currentTime = 0;
    else goTo(index - 1);
  }, [goTo, index]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(seconds)) audio.currentTime = Math.max(0, seconds);
  }, []);

  // Enchaînement automatique : à la fin d'un son, on passe au suivant.
  const onEnded = useCallback(() => {
    if (index + 1 < queue.length) goTo(index + 1);
    else setPlaying(false);
  }, [goTo, index, queue.length]);

  // L'URL signée a pu expirer (longue pause) : on retente une fois, la route en régénère une.
  const onError = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current || retriedRef.current === current.id) {
      setPlaying(false);
      return;
    }
    retriedRef.current = current.id;
    const at = audio.currentTime;
    audio.src = `${current.src}${current.src.includes("?") ? "&" : "?"}r=${Date.now()}`;
    audio.currentTime = at;
    audio.play().catch(() => setPlaying(false));
  }, [current]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.subtitle ?? "BeatDrop Project",
      artwork: current.coverUrl ? [{ src: current.coverUrl, sizes: "512x512" }] : undefined,
    });
    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("nexttrack", index + 1 < queue.length ? next : null);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, [current, index, queue.length, toggle, next, prev]);

  // Barre espace = lecture/pause (hors champs de saisie).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, [contenteditable]")) return;
      if (e.code === "Space" && current) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, toggle]);

  const value = useMemo(
    () => ({ queue, index, current, playing, play, toggle, next, prev, seek }),
    [queue, index, current, playing, play, toggle, next, prev, seek],
  );

  return (
    <PlayerContext.Provider value={value}>
      <TimeContext.Provider value={time}>
        {children}
        <audio
          ref={audioRef}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          onError={onError}
          onTimeUpdate={(e) =>
            setTime((t) => ({ ...t, time: e.currentTarget.currentTime }))
          }
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d)) setTime((t) => ({ ...t, duration: d }));
          }}
        />
      </TimeContext.Provider>
    </PlayerContext.Provider>
  );
}
