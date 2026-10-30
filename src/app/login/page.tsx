import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // N'accepte que des redirections internes à l'admin (évite les open redirects).
  const target = next && next.startsWith("/admin") ? next : "/admin";
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-sm flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        BeatDrop <span className="text-accent">Project</span>
      </h1>
      <LoginForm next={target} />
    </main>
  );
}
