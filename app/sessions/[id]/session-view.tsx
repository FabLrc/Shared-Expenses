"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionSummary } from "@/lib/calculations";
import type { Expense, ExpenseSession, User } from "@prisma/client";

type UserInfo = Pick<User, "id" | "name" | "image">;
type ExpenseWithAdder = Expense & { addedBy: UserInfo };
type SessionWithRelations = ExpenseSession & {
  creator: UserInfo;
  invitee: UserInfo | null;
  expenses: ExpenseWithAdder[];
};

interface Props {
  expSession: SessionWithRelations;
  currentUserId: string;
  summary: SessionSummary | null;
  shareUrl: string;
  formatCurrency: (amount: number) => string;
}

type Tab = "expenses" | "summary";

export function SessionView({
  expSession: initialSession,
  currentUserId,
  summary: initialSummary,
  shareUrl,
  formatCurrency,
}: Props) {
  const [session, setSession] = useState(initialSession);
  const [tab, setTab] = useState<Tab>("expenses");
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    amount: "",
    splitRatio: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isCreator = session.creatorId === currentUserId;
  const partner = isCreator ? session.invitee : session.creator;

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const res = await fetch(`/api/sessions/${session.id}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: formData.label,
        amount: parseFloat(formData.amount),
        splitRatio: formData.splitRatio ? parseFloat(formData.splitRatio) / 100 : null,
        date: formData.date ? new Date(formData.date).toISOString() : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "Erreur lors de l'ajout.");
      setFormLoading(false);
      return;
    }

    const newExpense: ExpenseWithAdder = await res.json();
    setSession((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }));
    setFormData({ label: "", amount: "", splitRatio: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    setFormLoading(false);
  }

  async function deleteExpense(expenseId: string) {
    setDeletingId(expenseId);
    const res = await fetch(
      `/api/sessions/${session.id}/expenses/${expenseId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setSession((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== expenseId),
      }));
    }
    setDeletingId(null);
  }

  // Recalculate summary from current session state
  const myExpenses = session.expenses.filter(
    (e) => e.addedById === currentUserId
  );
  const partnerExpenses = session.expenses.filter(
    (e) => e.addedById !== currentUserId
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="text-zinc-400 hover:text-zinc-900 text-sm shrink-0"
            >
              ← Retour
            </Link>
            <span className="text-zinc-300 shrink-0">/</span>
            <span className="text-sm font-medium truncate">{session.title}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                session.status === "OPEN"
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {session.status === "OPEN" ? "Active" : "Fermée"}
            </span>
          </div>

          {!session.invitee && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="shrink-0"
            >
              {copied ? "✓ Copié !" : "🔗 Inviter"}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Partner info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">Partenaire :</span>
            {partner ? (
              <span className="font-medium">{partner.name ?? "Invité"}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 italic">En attente…</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareLink}
                >
                  {copied ? "✓ Lien copié !" : "Copier le lien d'invitation"}
                </Button>
              </div>
            )}
          </div>
          <div className="text-sm text-zinc-500">
            Répartition par défaut :{" "}
            <span className="font-medium text-zinc-900">
              {Math.round(session.defaultSplitRatio * 100)}% /{" "}
              {Math.round((1 - session.defaultSplitRatio) * 100)}%
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200">
          {(["expenses", "summary"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t === "expenses" ? "Dépenses" : "Résumé"}
            </button>
          ))}
        </div>

        {/* EXPENSES TAB */}
        {tab === "expenses" && (
          <div className="space-y-4">
            {session.status === "OPEN" && (
              <>
                {!showForm ? (
                  <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                    + Ajouter une dépense
                  </Button>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Nouvelle dépense</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={addExpense} className="space-y-4">
                        {formError && (
                          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            {formError}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="label">Description</Label>
                            <Input
                              id="label"
                              placeholder="Ex: Restaurant, Courses…"
                              value={formData.label}
                              onChange={(e) =>
                                setFormData({ ...formData, label: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="amount">Montant</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              value={formData.amount}
                              onChange={(e) =>
                                setFormData({ ...formData, amount: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="date">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              value={formData.date}
                              onChange={(e) =>
                                setFormData({ ...formData, date: e.target.value })
                              }
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="splitRatio">
                              Ma part (
                              {formData.splitRatio
                                ? `${formData.splitRatio}%`
                                : `${Math.round(session.defaultSplitRatio * 100)}% (défaut)`}
                              )
                            </Label>
                            <Input
                              id="splitRatio"
                              type="number"
                              min="0"
                              max="100"
                              placeholder={`Laisser vide = ${Math.round(session.defaultSplitRatio * 100)}%`}
                              value={formData.splitRatio}
                              onChange={(e) =>
                                setFormData({ ...formData, splitRatio: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForm(false)}
                          >
                            Annuler
                          </Button>
                          <Button type="submit" disabled={formLoading}>
                            {formLoading ? "Ajout…" : "Ajouter"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* My expenses */}
            <ExpenseList
              title="Mes dépenses"
              expenses={myExpenses}
              currentUserId={currentUserId}
              defaultSplitRatio={session.defaultSplitRatio}
              formatCurrency={formatCurrency}
              onDelete={deleteExpense}
              deletingId={deletingId}
              canDelete={session.status === "OPEN"}
            />

            {/* Partner expenses */}
            {partnerExpenses.length > 0 && (
              <ExpenseList
                title={`Dépenses de ${partner?.name ?? "l'invité"}`}
                expenses={partnerExpenses}
                currentUserId={currentUserId}
                defaultSplitRatio={session.defaultSplitRatio}
                formatCurrency={formatCurrency}
                onDelete={deleteExpense}
                deletingId={deletingId}
                canDelete={false}
              />
            )}

            {session.expenses.length === 0 && (
              <p className="text-center text-zinc-400 py-8">
                Aucune dépense pour le moment.
              </p>
            )}
          </div>
        )}

        {/* SUMMARY TAB */}
        {tab === "summary" && (
          <SummaryView
            session={session}
            currentUserId={currentUserId}
            formatCurrency={formatCurrency}
          />
        )}
      </main>
    </div>
  );
}

function ExpenseList({
  title,
  expenses,
  currentUserId,
  defaultSplitRatio,
  formatCurrency,
  onDelete,
  deletingId,
  canDelete,
}: {
  title: string;
  expenses: ExpenseWithAdder[];
  currentUserId: string;
  defaultSplitRatio: number;
  formatCurrency: (n: number) => string;
  onDelete: (id: string) => void;
  deletingId: string | null;
  canDelete: boolean;
}) {
  if (expenses.length === 0) return null;

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
        <span className="text-sm font-medium">{formatCurrency(total)}</span>
      </div>
      <div className="space-y-2">
        {expenses.map((expense) => {
          const ratio = expense.splitRatio ?? defaultSplitRatio;
          const myShare =
            expense.addedById === currentUserId
              ? expense.amount * ratio
              : expense.amount * (1 - ratio);
          return (
            <div
              key={expense.id}
              className="flex items-center justify-between bg-white border border-zinc-200 rounded-lg px-4 py-3 gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{expense.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {new Date(expense.date).toLocaleDateString("fr-FR")}
                  {expense.splitRatio !== null && (
                    <span className="ml-2 text-zinc-400">
                      • répartition personnalisée ({Math.round(ratio * 100)}%)
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
                <p className="text-xs text-zinc-400">
                  ma part : {formatCurrency(myShare)}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={() => onDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="text-zinc-300 hover:text-red-400 transition-colors ml-2 shrink-0"
                  aria-label="Supprimer"
                >
                  {deletingId === expense.id ? "…" : "✕"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryView({
  session,
  currentUserId,
  formatCurrency,
}: {
  session: SessionWithRelations;
  currentUserId: string;
  formatCurrency: (n: number) => string;
}) {
  if (!session.invitee) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <div className="text-3xl mb-3">⏳</div>
          <CardDescription>
            Le résumé sera disponible une fois que votre partenaire aura
            rejoint la session.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (session.expenses.length === 0) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <div className="text-3xl mb-3">📊</div>
          <CardDescription>
            Ajoutez des dépenses pour voir le résumé.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // Recalculate inline
  const isCurrentUserCreator = session.creatorId === currentUserId;
  const currentUser = isCurrentUserCreator ? session.creator : session.invitee;
  const partner = isCurrentUserCreator ? session.invitee : session.creator;

  let creatorPaid = 0;
  let inviteePaid = 0;
  let creatorShouldPay = 0;
  let inviteeShouldPay = 0;

  for (const expense of session.expenses) {
    const ratio = expense.splitRatio ?? session.defaultSplitRatio;
    const cShare = expense.amount * ratio;
    const iShare = expense.amount * (1 - ratio);
    creatorShouldPay += cShare;
    inviteeShouldPay += iShare;
    if (expense.addedById === session.creatorId) creatorPaid += expense.amount;
    else inviteePaid += expense.amount;
  }

  const balance = creatorPaid - creatorShouldPay;
  const currentUserPaid = isCurrentUserCreator ? creatorPaid : inviteePaid;
  const currentUserShouldPay = isCurrentUserCreator
    ? creatorShouldPay
    : inviteeShouldPay;
  const partnerPaid = isCurrentUserCreator ? inviteePaid : creatorPaid;
  const partnerShouldPay = isCurrentUserCreator
    ? inviteeShouldPay
    : creatorShouldPay;

  // balance from current user's perspective
  const currentUserBalance = currentUserPaid - currentUserShouldPay;
  const total = creatorPaid + inviteePaid;

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <Card
        className={
          Math.abs(balance) < 0.005
            ? "border-green-200 bg-green-50"
            : balance > 0
            ? isCurrentUserCreator
              ? "border-green-200 bg-green-50"
              : "border-amber-200 bg-amber-50"
            : isCurrentUserCreator
            ? "border-amber-200 bg-amber-50"
            : "border-green-200 bg-green-50"
        }
      >
        <CardContent className="pt-6 text-center">
          <div className="text-3xl mb-2">
            {Math.abs(balance) < 0.005
              ? "🤝"
              : currentUserBalance > 0.005
              ? "💰"
              : "💸"}
          </div>
          {Math.abs(balance) < 0.005 ? (
            <p className="font-semibold text-green-700">
              Vous êtes à l&apos;équilibre !
            </p>
          ) : currentUserBalance > 0.005 ? (
            <>
              <p className="font-semibold text-green-700">
                {partner?.name ?? "Votre partenaire"} vous doit
              </p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {formatCurrency(Math.abs(currentUserBalance))}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-700">
                Vous devez à {partner?.name ?? "votre partenaire"}
              </p>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {formatCurrency(Math.abs(currentUserBalance))}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Détail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Row
              label="Total des dépenses"
              value={formatCurrency(total)}
              bold
            />
            <div className="border-t border-zinc-100" />
            <Row
              label={`${currentUser?.name ?? "Vous"} — payé`}
              value={formatCurrency(currentUserPaid)}
            />
            <Row
              label={`${currentUser?.name ?? "Vous"} — doit payer`}
              value={formatCurrency(currentUserShouldPay)}
            />
            <div className="border-t border-zinc-100" />
            <Row
              label={`${partner?.name ?? "Partenaire"} — payé`}
              value={formatCurrency(partnerPaid)}
            />
            <Row
              label={`${partner?.name ?? "Partenaire"} — doit payer`}
              value={formatCurrency(partnerShouldPay)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-expense breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Par dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-zinc-100">
            {session.expenses.map((expense) => {
              const ratio = expense.splitRatio ?? session.defaultSplitRatio;
              const cShare = expense.amount * ratio;
              const iShare = expense.amount * (1 - ratio);
              const myShare = isCurrentUserCreator ? cShare : iShare;
              const partnerShare = isCurrentUserCreator ? iShare : cShare;
              return (
                <div
                  key={expense.id}
                  className="py-3 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.label}</p>
                    <p className="text-xs text-zinc-400">
                      Payé par {expense.addedBy.name ?? "—"} •{" "}
                      {new Date(expense.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500 shrink-0 space-y-0.5">
                    <p>Total : {formatCurrency(expense.amount)}</p>
                    <p>
                      Vous : {formatCurrency(myShare)} /{" "}
                      {partner?.name ?? "Partenaire"} :{" "}
                      {formatCurrency(partnerShare)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold" : ""}`}>
      <span className="text-zinc-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
