import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth";
import { formatCurrency } from "@/lib/calculations";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const sessions = await prisma.expenseSession.findMany({
    where: {
      OR: [{ creatorId: session.user.id }, { inviteeId: session.user.id }],
    },
    include: {
      creator: { select: { id: true, name: true } },
      invitee: { select: { id: true, name: true } },
      expenses: { select: { id: true, amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold">
            💸 SplitMate
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              {session.user.name ?? session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Déconnexion
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mes sessions</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {sessions.length === 0
                ? "Aucune session pour le moment"
                : `${sessions.length} session${sessions.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/sessions/new">
            <Button>+ Nouvelle session</Button>
          </Link>
        </div>

        {sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-4xl mb-4">🤝</div>
              <p className="text-zinc-500 mb-4">
                Créez votre première session pour commencer à partager vos dépenses.
              </p>
              <Link href="/sessions/new">
                <Button>Créer une session</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const totalAmount = s.expenses.reduce((sum, e) => sum + e.amount, 0);
              const isCreator = s.creatorId === session.user!.id;
              const partner = isCreator ? s.invitee : s.creator;

              return (
                <Link key={s.id} href={`/sessions/${s.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{s.title}</CardTitle>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.status === "OPEN"
                              ? "bg-green-100 text-green-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {s.status === "OPEN" ? "Active" : "Fermée"}
                        </span>
                      </div>
                      <CardDescription>
                        {partner
                          ? `Avec ${partner.name ?? "Invité"}`
                          : "En attente d'un invité"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-zinc-500">
                        <span>{s.expenses.length} dépense{s.expenses.length > 1 ? "s" : ""}</span>
                        <span className="font-medium text-zinc-900">
                          {formatCurrency(totalAmount, s.currency)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
