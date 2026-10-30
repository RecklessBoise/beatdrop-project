import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-xs font-medium tracking-[0.3em] text-muted uppercase">Private beat sharing</p>
      <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
        BeatDrop <span className="text-accent">Project</span>
      </h1>
      <p className="max-w-sm text-sm text-muted">
        Tu as reçu un lien ? Ouvre-le directement pour écouter les productions.
      </p>
      <Link href="/admin" className="btn-ghost">Espace beatmaker</Link>
    </main>
  );
}
