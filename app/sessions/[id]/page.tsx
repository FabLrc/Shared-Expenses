import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { calculateSessionSummary } from "@/lib/calculations";
import { SessionView } from "./session-view";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const expSession = await prisma.expenseSession.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      invitee: { select: { id: true, name: true, image: true } },
      expenses: {
        include: { addedBy: { select: { id: true, name: true, image: true } } },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!expSession) notFound();

  const isMember =
    expSession.creatorId === session.user.id ||
    expSession.inviteeId === session.user.id;

  if (!isMember) redirect("/dashboard");

  const summary = calculateSessionSummary(expSession);
  const shareUrl = `${(process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")}/join/${expSession.shareCode}`;

  return (
    <SessionView
      expSession={JSON.parse(JSON.stringify(expSession))}
      currentUserId={session.user.id}
      summary={summary}
      shareUrl={shareUrl}
      currency={expSession.currency}
    />
  );
}
