"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  sessionId: string;
  isCreator: boolean;
}

export function SessionActions({ sessionId, isCreator }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction() {
    setLoading(true);
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div
        className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {isCreator
            ? "Supprimer cette session et toutes ses dépenses ?"
            : "Quitter cette session ? Vos dépenses seront conservées."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAction(); }}
            disabled={loading}
          >
            {loading
              ? (isCreator ? "Suppression…" : "Départ…")
              : "Confirmer"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors shrink-0"
      aria-label={isCreator ? "Supprimer la session" : "Quitter la session"}
    >
      {isCreator ? "✕" : "↩"}
    </button>
  );
}
