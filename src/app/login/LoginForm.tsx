"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/api/auth/login", "POST", { password });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3">
      <label className="text-sm text-muted" htmlFor="password">
        Mot de passe
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        className="input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="btn-primary mt-1" disabled={pending || !password}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
