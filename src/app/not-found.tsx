import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-xs font-medium tracking-widest text-muted uppercase">BeatDrop Project</p>
      <h1 className="text-2xl font-semibold">Lien introuvable</h1>
      <p className="text-sm text-muted">Ce dossier n’existe pas ou son lien a été changé.</p>
      <Link href="/" className="btn-ghost mt-2">Accueil</Link>
    </main>
  );
}
