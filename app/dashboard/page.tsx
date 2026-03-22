import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth";
import { formatCurrency } from "@/lib/calculations";
import { ThemeToggle } from "@/components/theme-toggle";

const PAGE_SIZE = 10;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const userId = session.user.id;

  const [sessions, totalCount] = await Promise.all([
    prisma.expenseSession.findMany({
      where: { OR: [{ creatorId: userId }, { inviteeId: userId }] },
      include: {
        creator: { select: { id: true, name: true } },
        invitee: { select: { id: true, name: true } },
        expenses: { select: { id: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.expenseSession.count({
      where: { OR: [{ creatorId: userId }, { inviteeId: userId }] },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold">
            💸 SplitMate
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {session.user.name ?? session.user.email}
            </span>
            <ThemeToggle />
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
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              {totalCount === 0
                ? "Aucune session pour le moment"
                : `${totalCount} session${totalCount > 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/sessions/new">
            <Button>+ Nouvelle session</Button>
          </Link>
        </div>

        {totalCount === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-4xl mb-4">🤝</div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                Créez votre première session pour commencer à partager vos dépenses.
              </p>
              <Link href="/sessions/new">
                <Button>Créer une session</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
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
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
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
                        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                          <span>
                            {s.expenses.length} dépense{s.expenses.length > 1 ? "s" : ""}
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(totalAmount, s.currency)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`/dashboard?page=${page - 1}`}>
                      <Button variant="outline" size="sm">
                        ← Précédent
                      </Button>
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={`/dashboard?page=${page + 1}`}>
                      <Button variant="outline" size="sm">
                        Suivant →
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
