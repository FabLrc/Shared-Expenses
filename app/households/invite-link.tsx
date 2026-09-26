"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function HouseholdInviteLink({ shareCode }: { shareCode: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const base = window.location.origin;
    await navigator.clipboard.writeText(`${base}/foyer/join/${shareCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? "✓ Copié !" : "🔗 Copier le lien d'invitation"}
    </Button>
  );
}
