"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm text-muted hover:text-text"
      onClick={async () => {
        await api("/api/auth/logout", "POST");
        router.replace("/login");
        router.refresh();
      }}
    >
      Déconnexion
    </button>
  );
}
