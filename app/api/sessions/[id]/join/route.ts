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

  if (expSession.inviteeId && expSession.inviteeId !== session.user.id) {
    return NextResponse.json(
      { error: "Cette session a déjà un invité." },
      { status: 400 }
    );
  }

  if (expSession.inviteeId === session.user.id) {
    return NextResponse.json(expSession);
  }

  const updated = await prisma.expenseSession.update({
    where: { id },
    data: { inviteeId: session.user.id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      invitee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(updated);
}
