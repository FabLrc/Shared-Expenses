import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const expSession = await prisma.expenseSession.findUnique({
    where: { shareCode: code },
    select: { id: true, title: true, shareCode: true, status: true },
  });

  if (!expSession) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
  }

  return NextResponse.json(expSession);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const expSession = await prisma.expenseSession.findUnique({
    where: { shareCode: code },
  });

  if (!expSession) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
  }

  if (expSession.creatorId === session.user.id) {
    return NextResponse.json({ redirect: `/sessions/${expSession.id}` });
  }

  if (expSession.inviteeId && expSession.inviteeId !== session.user.id) {
    return NextResponse.json(
      { error: "Cette session a déjà un invité." },
      { status: 400 }
    );
  }

  if (!expSession.inviteeId) {
    await prisma.expenseSession.update({
      where: { id: expSession.id },
      data: { inviteeId: session.user.id },
    });
  }

  return NextResponse.json({ redirect: `/sessions/${expSession.id}` });
}
