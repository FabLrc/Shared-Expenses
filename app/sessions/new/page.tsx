"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];

export default function NewSessionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    defaultSplitRatio: 50,
    currency: "EUR",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        defaultSplitRatio: form.defaultSplitRatio / 100,
        currency: form.currency,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de la création.");
      setLoading(false);
      return;
    }

    const session = await res.json();
    router.push(`/sessions/${session.id}`);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-900 text-sm">
            ← Retour
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm font-medium">Nouvelle session</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle session</CardTitle>
            <CardDescription>
              Définissez les paramètres de votre session de dépenses partagées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="title">Nom de la session</Label>
                <Input
                  id="title"
                  placeholder="Ex: Vacances été 2025, Loyer mars…"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency">Devise</Label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="split">
                  Répartition par défaut — vous payez{" "}
                  <span className="font-bold text-zinc-900">{form.defaultSplitRatio}%</span>
                </Label>
                <input
                  id="split"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.defaultSplitRatio}
                  onChange={(e) =>
                    setForm({ ...form, defaultSplitRatio: Number(e.target.value) })
                  }
                  className="w-full accent-zinc-900"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>0% (l&apos;autre paie tout)</span>
                  <span>50/50</span>
                  <span>100% (vous payez tout)</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Création…" : "Créer la session"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
