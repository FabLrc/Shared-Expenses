import Link from "next/link";
import { NewSessionForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ household?: string }>;
}) {
  const { household } = await searchParams;

  return (
    <div className="min-h-screen dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm">
            ← Retour
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-sm font-medium">Nouvelle session</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <NewSessionForm preselectHousehold={household ?? null} />
      </main>
    </div>
  );
}
