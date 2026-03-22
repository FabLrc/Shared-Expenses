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
import { formatCurrency } from "@/lib/calculations";
import type { SessionSummary } from "@/lib/calculations";
import type { Expense, ExpenseSession, User } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";

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
  currency: string;
}

type Tab = "expenses" | "summary";

export function SessionView({
  expSession: initialSession,
  currentUserId,
  summary: initialSummary,
  shareUrl,
  currency,
}: Props) {
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const [session, setSession] = useState(initialSession);
  const [tab, setTab] = useState<Tab>("expenses");
  const [copied, setCopied] = useState(false);

  // Add expense
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    amount: "",
    splitRatio: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit expense
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    label: "",
    amount: "",
    splitRatio: "",
    date: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Close session
  const [closingSession, setClosingSession] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Settle balance
  const [settling, setSettling] = useState(false);

  // Search
  const [search, setSearch] = useState("");

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
    setSession((prev) => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
    setFormData({ label: "", amount: "", splitRatio: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    setFormLoading(false);
  }

  async function deleteExpense(expenseId: string) {
    setDeletingId(expenseId);
    const res = await fetch(`/api/sessions/${session.id}/expenses/${expenseId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSession((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== expenseId),
      }));
    }
    setDeletingId(null);
  }

  function startEdit(expense: ExpenseWithAdder) {
    setEditingId(expense.id);
    setEditError("");
    setEditForm({
      label: expense.label,
      amount: String(expense.amount),
      splitRatio: expense.splitRatio != null ? String(Math.round(expense.splitRatio * 100)) : "",
      date: new Date(expense.date).toISOString().split("T")[0],
    });
  }

  async function saveEdit(e: React.FormEvent, expenseId: string) {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    const res = await fetch(`/api/sessions/${session.id}/expenses/${expenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: editForm.label,
        amount: parseFloat(editForm.amount),
        splitRatio: editForm.splitRatio ? parseFloat(editForm.splitRatio) / 100 : null,
        date: editForm.date ? new Date(editForm.date).toISOString() : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error ?? "Erreur lors de la modification.");
      setEditLoading(false);
      return;
    }

    const updated: ExpenseWithAdder = await res.json();
    setSession((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === expenseId ? updated : e)),
    }));
    setEditingId(null);
    setEditLoading(false);
  }

  async function closeSession() {
    setClosingSession(true);
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    if (res.ok) {
      setSession((prev) => ({ ...prev, status: "CLOSED" }));
    }
    setClosingSession(false);
    setConfirmClose(false);
  }

  async function settleBalance(amount: number, splitRatio: number) {
    setSettling(true);
    const res = await fetch(`/api/sessions/${session.id}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: "Remboursement",
        amount,
        splitRatio,
        date: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      const newExpense: ExpenseWithAdder = await res.json();
      setSession((prev) => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
      setTab("expenses");
    }
    setSettling(false);
  }

  const filteredExpenses = search.trim()
    ? session.expenses.filter((e) =>
        e.label.toLowerCase().includes(search.toLowerCase())
      )
    : session.expenses;

  const myExpenses = filteredExpenses.filter((e) => e.addedById === currentUserId);
  const partnerExpenses = filteredExpenses.filter((e) => e.addedById !== currentUserId);

  return (
    <div className="min-h-screen dark:bg-zinc-900 pb-safe">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Left: back + title + badge */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/dashboard"
              className="text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm shrink-0 p-1 -ml-1"
              aria-label="Retour au dashboard"
            >
              ←
            </Link>
            <span className="text-zinc-300 dark:text-zinc-500 shrink-0">/</span>
            <span className="text-sm font-medium truncate">{session.title}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                session.status === "OPEN"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {session.status === "OPEN" ? "Active" : "Fermée"}
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            {!session.invitee && (
              <Button variant="outline" size="sm" onClick={copyShareLink}>
                <span className="hidden sm:inline">
                  {copied ? "✓ Copié !" : "🔗 Inviter"}
                </span>
                <span className="sm:hidden" aria-label="Inviter">
                  {copied ? "✓" : "🔗"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Partner info */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Partenaire :</span>
            {partner ? (
              <span className="font-medium">{partner.name ?? "Invité"}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 dark:text-zinc-300 italic">En attente…</span>
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  {copied ? "✓ Copié !" : "Copier le lien"}
                </Button>
              </div>
            )}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Répartition :{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {Math.round(session.defaultSplitRatio * 100)}% /{" "}
              {Math.round((1 - session.defaultSplitRatio) * 100)}%
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700">
          {(["expenses", "summary"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
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
                  <Button onClick={() => setShowForm(true)} className="w-full">
                    + Ajouter une dépense
                  </Button>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Nouvelle dépense</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={addExpense} className="space-y-4">
                        {formError && (
                          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">
                            {formError}
                          </p>
                        )}
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="label">Description</Label>
                            <Input
                              id="label"
                              placeholder="Ex: Restaurant, Courses…"
                              value={formData.label}
                              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="amount">Montant</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                inputMode="decimal"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="date">Date</Label>
                              <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="splitRatio">
                              Ma part (
                              {formData.splitRatio
                                ? `${formData.splitRatio}%`
                                : `${Math.round(session.defaultSplitRatio * 100)}% par défaut`}
                              )
                            </Label>
                            <Input
                              id="splitRatio"
                              type="number"
                              inputMode="numeric"
                              min="0"
                              max="100"
                              placeholder={`Laisser vide = ${Math.round(session.defaultSplitRatio * 100)}%`}
                              value={formData.splitRatio}
                              onChange={(e) => setFormData({ ...formData, splitRatio: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                            Annuler
                          </Button>
                          <Button type="submit" className="flex-1" disabled={formLoading}>
                            {formLoading ? "Ajout…" : "Ajouter"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Search */}
            {session.expenses.length > 0 && (
              <Input
                placeholder="Rechercher une dépense…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}

            {/* My expenses */}
            <ExpenseList
              title="Mes dépenses"
              expenses={myExpenses}
              currentUserId={currentUserId}
              defaultSplitRatio={session.defaultSplitRatio}
              formatCurrency={fmt}
              onDelete={deleteExpense}
              deletingId={deletingId}
              canDelete={session.status === "OPEN"}
              editingId={editingId}
              editForm={editForm}
              editLoading={editLoading}
              editError={editError}
              onEdit={startEdit}
              onEditChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
              onEditSave={saveEdit}
              onEditCancel={() => setEditingId(null)}
            />

            {/* Partner expenses */}
            {partnerExpenses.length > 0 && (
              <ExpenseList
                title={`Dépenses de ${partner?.name ?? "l'invité"}`}
                expenses={partnerExpenses}
                currentUserId={currentUserId}
                defaultSplitRatio={session.defaultSplitRatio}
                formatCurrency={fmt}
                onDelete={deleteExpense}
                deletingId={deletingId}
                canDelete={false}
                editingId={editingId}
                editForm={editForm}
                editLoading={editLoading}
                editError={editError}
                onEdit={startEdit}
                onEditChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                onEditSave={saveEdit}
                onEditCancel={() => setEditingId(null)}
              />
            )}

            {filteredExpenses.length === 0 && session.expenses.length === 0 && (
              <p className="text-center text-zinc-400 dark:text-zinc-400 py-10">
                Aucune dépense pour le moment.
              </p>
            )}
            {filteredExpenses.length === 0 && session.expenses.length > 0 && (
              <p className="text-center text-zinc-400 dark:text-zinc-400 py-10">
                Aucune dépense ne correspond à votre recherche.
              </p>
            )}
          </div>
        )}

        {/* SUMMARY TAB */}
        {tab === "summary" && (
          <div className="space-y-4">
            <SummaryView
              session={session}
              currentUserId={currentUserId}
              formatCurrency={fmt}
              onSettle={settleBalance}
              settling={settling}
            />

            {/* Close session — creator only, OPEN only, at bottom of summary */}
            {isCreator && session.status === "OPEN" && (
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Fermer la session
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-300 mt-1">
                    Une session fermée ne peut plus recevoir de nouvelles dépenses. Cette action est irréversible.
                  </p>
                </div>
                {!confirmClose ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmClose(true)}
                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Fermer la session
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirmClose(false)}>
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={closeSession}
                      disabled={closingSession}
                    >
                      {closingSession ? "Fermeture…" : "Confirmer"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
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
  editingId,
  editForm,
  editLoading,
  editError,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
}: {
  title: string;
  expenses: ExpenseWithAdder[];
  currentUserId: string;
  defaultSplitRatio: number;
  formatCurrency: (n: number) => string;
  onDelete: (id: string) => void;
  deletingId: string | null;
  canDelete: boolean;
  editingId: string | null;
  editForm: { label: string; amount: string; splitRatio: string; date: string };
  editLoading: boolean;
  editError: string;
  onEdit: (expense: ExpenseWithAdder) => void;
  onEditChange: (field: string, value: string) => void;
  onEditSave: (e: React.FormEvent, expenseId: string) => void;
  onEditCancel: () => void;
}) {
  if (expenses.length === 0) return null;

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
        <span className="text-sm font-medium">{formatCurrency(total)}</span>
      </div>
      <div className="space-y-2">
        {expenses.map((expense) => {
          const ratio = expense.splitRatio ?? defaultSplitRatio;
          const myShare =
            expense.addedById === currentUserId
              ? expense.amount * ratio
              : expense.amount * (1 - ratio);
          const isEditing = editingId === expense.id;
          const isOwn = expense.addedById === currentUserId;

          if (isEditing) {
            return (
              <Card key={expense.id}>
                <CardContent className="pt-4">
                  <form onSubmit={(e) => onEditSave(e, expense.id)} className="space-y-3">
                    {editError && (
                      <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">
                        {editError}
                      </p>
                    )}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Input
                          value={editForm.label}
                          onChange={(e) => onEditChange("label", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Montant</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            inputMode="decimal"
                            value={editForm.amount}
                            onChange={(e) => onEditChange("amount", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => onEditChange("date", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Ma part ({editForm.splitRatio ? `${editForm.splitRatio}%` : "défaut"})</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          inputMode="numeric"
                          placeholder="Laisser vide = défaut"
                          value={editForm.splitRatio}
                          onChange={(e) => onEditChange("splitRatio", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onEditCancel}>
                        Annuler
                      </Button>
                      <Button type="submit" size="sm" className="flex-1" disabled={editLoading}>
                        {editLoading ? "Sauvegarde…" : "Sauvegarder"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            );
          }

          return (
            <div
              key={expense.id}
              className="flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{expense.label}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-400 mt-0.5">
                  {new Date(expense.date).toLocaleDateString("fr-FR")}
                  {expense.splitRatio !== null && (
                    <span className="ml-2">
                      • {Math.round(ratio * 100)}% personnalisé
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(expense.amount)}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-400">
                  ma part : {formatCurrency(myShare)}
                </p>
              </div>
              {/* Action buttons — proper touch targets */}
              {isOwn && canDelete && (
                <button
                  onClick={() => onEdit(expense)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
                  aria-label="Modifier"
                >
                  ✏️
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors shrink-0"
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
  onSettle,
  settling,
}: {
  session: SessionWithRelations;
  currentUserId: string;
  formatCurrency: (n: number) => string;
  onSettle: (amount: number, splitRatio: number) => Promise<void>;
  settling: boolean;
}) {
  if (!session.invitee) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <div className="text-3xl mb-3">⏳</div>
          <CardDescription>
            Le résumé sera disponible une fois que votre partenaire aura rejoint la session.
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
          <CardDescription>Ajoutez des dépenses pour voir le résumé.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  const isCurrentUserCreator = session.creatorId === currentUserId;
  const currentUser = isCurrentUserCreator ? session.creator : session.invitee;
  const partner = isCurrentUserCreator ? session.invitee : session.creator;

  let creatorPaid = 0;
  let inviteePaid = 0;
  let creatorShouldPay = 0;
  let inviteeShouldPay = 0;

  for (const expense of session.expenses) {
    const ratio = expense.splitRatio ?? session.defaultSplitRatio;
    creatorShouldPay += expense.amount * ratio;
    inviteeShouldPay += expense.amount * (1 - ratio);
    if (expense.addedById === session.creatorId) creatorPaid += expense.amount;
    else inviteePaid += expense.amount;
  }

  const balance = creatorPaid - creatorShouldPay;
  const currentUserPaid = isCurrentUserCreator ? creatorPaid : inviteePaid;
  const currentUserShouldPay = isCurrentUserCreator ? creatorShouldPay : inviteeShouldPay;
  const partnerPaid = isCurrentUserCreator ? inviteePaid : creatorPaid;
  const partnerShouldPay = isCurrentUserCreator ? inviteeShouldPay : creatorShouldPay;
  const currentUserBalance = currentUserPaid - currentUserShouldPay;
  const total = creatorPaid + inviteePaid;

  const settled = Math.abs(balance) < 0.005;
  const currentUserOwes = currentUserBalance < -0.005;

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <Card
        className={
          settled
            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
            : balance > 0
            ? isCurrentUserCreator
              ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
              : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950"
            : isCurrentUserCreator
            ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950"
            : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
        }
      >
        <CardContent className="pt-6 text-center pb-6">
          <div className="text-4xl mb-3">
            {settled ? "🤝" : currentUserBalance > 0.005 ? "💰" : "💸"}
          </div>
          {settled ? (
            <p className="font-semibold text-green-700 dark:text-green-400">
              Vous êtes à l&apos;équilibre !
            </p>
          ) : currentUserBalance > 0.005 ? (
            <>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                {partner?.name ?? "Votre partenaire"} vous doit
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                {formatCurrency(Math.abs(currentUserBalance))}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Vous devez à {partner?.name ?? "votre partenaire"}
              </p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                {formatCurrency(Math.abs(currentUserBalance))}
              </p>
            </>
          )}

          {currentUserOwes && session.status === "OPEN" && (
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={() =>
                onSettle(Math.abs(currentUserBalance), isCurrentUserCreator ? 0 : 1)
              }
              disabled={settling}
            >
              {settling
                ? "Enregistrement…"
                : `Marquer comme soldé (${formatCurrency(Math.abs(currentUserBalance))})`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Détail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Row label="Total" value={formatCurrency(total)} bold />
            <div className="border-t border-zinc-100 dark:border-zinc-700" />
            <Row label={`${currentUser?.name ?? "Vous"} — payé`} value={formatCurrency(currentUserPaid)} />
            <Row label={`${currentUser?.name ?? "Vous"} — doit`} value={formatCurrency(currentUserShouldPay)} />
            <div className="border-t border-zinc-100 dark:border-zinc-700" />
            <Row label={`${partner?.name ?? "Partenaire"} — payé`} value={formatCurrency(partnerPaid)} />
            <Row label={`${partner?.name ?? "Partenaire"} — doit`} value={formatCurrency(partnerShouldPay)} />
          </div>
        </CardContent>
      </Card>

      {/* Per-expense */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Par dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {session.expenses.map((expense) => {
              const ratio = expense.splitRatio ?? session.defaultSplitRatio;
              const cShare = expense.amount * ratio;
              const iShare = expense.amount * (1 - ratio);
              const myShare = isCurrentUserCreator ? cShare : iShare;
              const partnerShare = isCurrentUserCreator ? iShare : cShare;
              return (
                <div key={expense.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.label}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-400 mt-0.5">
                      {expense.addedBy.name ?? "—"} •{" "}
                      {new Date(expense.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 shrink-0 space-y-0.5">
                    <p className="font-medium">{formatCurrency(expense.amount)}</p>
                    <p>
                      Vous {formatCurrency(myShare)} / {partner?.name ?? "Partenaire"}{" "}
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold" : ""}`}>
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}
