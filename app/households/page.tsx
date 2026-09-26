import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreateHouseholdForm } from "./create-form";
import { HouseholdInviteLink } from "./invite-link";

export const dynamic = "force-dynamic";

export default async function HouseholdsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const memberships = await prisma.householdMember.findMany({
    where: { userId: session.user.id },
    include: {
      household: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const households = memberships.map((m) => ({
    ...m.household,
    myRole: m.role,
  }));

  return (
    <div className="min-h-screen dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm shrink-0"
          >
            ← Retour
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-sm font-medium">Mes foyers</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Créer un foyer</CardTitle>
            <CardDescription>
              Un foyer regroupe les personnes avec qui vous partagez souvent des
              dépenses. Vous pourrez ensuite créer des sessions pré-assignées à
              un membre du foyer en un clic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateHouseholdForm />
          </CardContent>
        </Card>

        {households.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent>
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-zinc-500 dark:text-zinc-400">
                Aucun foyer pour le moment. Créez-en un ci-dessus ou rejoignez
                un foyer via un lien d&apos;invitation.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {households.map((h) => (
              <Card key={h.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/households/${h.id}`} className="hover:underline">
                      <CardTitle className="text-base">{h.name}</CardTitle>
                    </Link>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        h.myRole === "OWNER"
                          ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                          : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {h.myRole === "OWNER" ? "Propriétaire" : "Membre"}
                    </span>
                  </div>
                  <CardDescription>
                    {h.members.length} membre{h.members.length > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {h.members
                      .map((m) => m.user.name ?? "Invité")
                      .join(", ")}
                  </div>
                  <HouseholdInviteLink shareCode={h.shareCode} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
