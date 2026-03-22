import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { JoinClient } from "./join-client";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();

  const expSession = await prisma.expenseSession.findUnique({
    where: { shareCode: code },
    select: {
      id: true,
      title: true,
      shareCode: true,
      status: true,
      creatorId: true,
      inviteeId: true,
      creator: { select: { name: true } },
    },
  });

  if (!expSession) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <div>
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-zinc-500">Ce lien d&apos;invitation n&apos;existe pas ou a expiré.</p>
        </div>
      </main>
    );
  }

  // If already logged in, handle the join server-side
  if (session?.user?.id) {
    // Creator accessing their own session
    if (expSession.creatorId === session.user.id) {
      redirect(`/sessions/${expSession.id}`);
    }

    // Already joined
    if (expSession.inviteeId === session.user.id) {
      redirect(`/sessions/${expSession.id}`);
    }

    // Session already has a different invitee
    if (expSession.inviteeId && expSession.inviteeId !== session.user.id) {
      return (
        <main className="flex flex-1 items-center justify-center px-4 py-16 text-center">
          <div>
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-bold mb-2">Session complète</h1>
            <p className="text-zinc-500">
              Cette session a déjà deux participants.
            </p>
          </div>
        </main>
      );
    }

    // Join the session
    await prisma.expenseSession.update({
      where: { id: expSession.id },
      data: { inviteeId: session.user.id },
    });

    redirect(`/sessions/${expSession.id}`);
  }

  // Not logged in — show join page
  return (
    <JoinClient
      sessionTitle={expSession.title}
      creatorName={expSession.creator.name ?? "Quelqu'un"}
      shareCode={code}
    />
  );
}
