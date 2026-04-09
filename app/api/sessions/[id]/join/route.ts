import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const expSession = await prisma.expenseSession.findUnique({
    where: { id },
  });

  if (!expSession) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }

  if (expSession.creatorId === session.user.id) {
    return NextResponse.json(
      { error: "Vous êtes déjà le créateur de cette session." },
      { status: 400 }
    );
  }

  if (expSession.inviteeId === session.user.id) {
    return NextResponse.json(expSession);
  }

  if (expSession.inviteeId) {
    return NextResponse.json(
      { error: "Cette session a déjà un invité." },
      { status: 400 }
    );
  }

  // Atomic update: only succeeds if inviteeId is still null (no race condition)
  const { count } = await prisma.expenseSession.updateMany({
    where: { id, inviteeId: null },
    data: { inviteeId: session.user.id },
  });

  if (count === 0) {
    return NextResponse.json(
      { error: "Cette session a déjà un invité." },
      { status: 400 }
    );
  }

  const updated = await prisma.expenseSession.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      invitee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(updated);
}
