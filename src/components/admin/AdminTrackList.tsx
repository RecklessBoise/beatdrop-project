"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Track } from "@/lib/db";
import { formatDuration } from "@/lib/access";
import { api } from "@/lib/client-api";
import { GripIcon, PauseIcon, PlayIcon, TrashIcon } from "@/components/Icons";
import { usePlayer, type PlayableTrack } from "@/components/player/PlayerProvider";

type Props = { folderName: string; shareSlug: string; tracks: Track[]; cover: string | null };

export function AdminTrackList({ folderName, shareSlug, tracks, cover }: Props) {
  const [items, setItems] = useState(tracks);
  const [synced, setSynced] = useState(tracks);
  const [error, setError] = useState<string | null>(null);
  const { current, playing, play } = usePlayer();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Resynchronise quand le serveur renvoie une nouvelle liste (upload, suppression…).
  if (tracks !== synced) {
    setSynced(tracks);
    setItems(tracks);
  }

  const queue: PlayableTrack[] = items.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: folderName,
    src: `/api/s/${shareSlug}/tracks/${t.id}`,
    durationSec: t.duration_sec,
    peaks: t.peaks,
    coverUrl: cover,
  }));

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(
      items,
      items.findIndex((t) => t.id === active.id),
      items.findIndex((t) => t.id === over.id),
    );
    setItems(next);
    try {
      await api(`/api/folders/${next[0].folder_id}/order`, "PUT", { trackIds: next.map((t) => t.id) });
    } catch (err) {
      setItems(previous);
      setError((err as Error).message);
    }
  }

  async function save(track: Track, patch: Partial<Pick<Track, "title" | "bpm" | "music_key">>) {
    setError(null);
    try {
      const updated = await api<Track>(`/api/tracks/${track.id}`, "PATCH", patch);
      setItems((all) => all.map((t) => (t.id === track.id ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(track: Track) {
    if (!confirm(`Supprimer « ${track.title} » ? C’est définitif.`)) return;
    setError(null);
    try {
      await api(`/api/tracks/${track.id}`, "DELETE");
      setItems((all) => all.filter((t) => t.id !== track.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Aucun son. Ajoute tes prods ci-dessus.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {items.map((track, i) => (
              <Row
                key={track.id}
                track={track}
                index={i}
                isPlaying={current?.id === track.id && playing}
                isCurrent={current?.id === track.id}
                onPlay={() => play(queue, i)}
                onSave={(patch) => save(track, patch)}
                onDelete={() => remove(track)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

type RowProps = {
  track: Track;
  index: number;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: () => void;
  onSave: (patch: Partial<Pick<Track, "title" | "bpm" | "music_key">>) => void;
  onDelete: () => void;
};

function Row({ track, index, isPlaying, isCurrent, onPlay, onSave, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });
  const [title, setTitle] = useState(track.title);
  const [bpm, setBpm] = useState(track.bpm?.toString() ?? "");
  const [musicKey, setMusicKey] = useState(track.music_key ?? "");

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3 ${isDragging ? "relative z-10 bg-surface-2 shadow-lg" : ""} ${isCurrent ? "bg-surface-2" : ""}`}
    >
      <button
        className="cursor-grab touch-none p-1 text-muted hover:text-text active:cursor-grabbing"
        aria-label={`Déplacer ${track.title}`}
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <span className="w-5 text-right font-mono text-xs tabular-nums text-muted">{index + 1}</span>
      <button
        onClick={onPlay}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 hover:bg-text hover:text-bg"
        aria-label={isPlaying ? "Pause" : `Écouter ${track.title}`}
      >
        {isPlaying ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5 translate-x-px" />}
      </button>
      <input
        className={`min-w-0 flex-1 rounded bg-transparent px-1 py-1 text-sm outline-none focus:bg-surface-2 ${isCurrent ? "text-accent" : ""}`}
        value={title}
        maxLength={200}
        aria-label="Titre"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          const t = title.trim();
          if (!t) setTitle(track.title);
          else if (t !== track.title) onSave({ title: t });
        }}
      />
      <input
        className="hidden w-16 rounded bg-surface-2 px-2 py-1 text-xs outline-none placeholder:text-muted focus:ring-1 focus:ring-accent sm:block"
        placeholder="BPM"
        inputMode="numeric"
        value={bpm}
        aria-label="BPM"
        onChange={(e) => setBpm(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onBlur={() => {
          const n = bpm ? Number(bpm) : null;
          if (n !== null && (n < 20 || n > 400)) setBpm(track.bpm?.toString() ?? "");
          else if (n !== track.bpm) onSave({ bpm: n });
        }}
      />
      <input
        className="hidden w-16 rounded bg-surface-2 px-2 py-1 text-xs outline-none placeholder:text-muted focus:ring-1 focus:ring-accent sm:block"
        placeholder="Tonalité"
        value={musicKey}
        maxLength={12}
        aria-label="Tonalité"
        onChange={(e) => setMusicKey(e.target.value)}
        onBlur={() => {
          const k = musicKey.trim() || null;
          if (k !== track.music_key) onSave({ music_key: k });
        }}
      />
      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted">
        {formatDuration(track.duration_sec)}
      </span>
      <button onClick={onDelete} className="rounded-full p-2 text-muted hover:text-danger" aria-label={`Supprimer ${track.title}`}>
        <TrashIcon className="size-4" />
      </button>
    </li>
  );
}
