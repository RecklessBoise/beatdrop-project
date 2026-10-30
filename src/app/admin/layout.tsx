import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="font-semibold tracking-tight">
            BeatDrop <span className="text-accent">Project</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      {children}
    </>
  );
}
