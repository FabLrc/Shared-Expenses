import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getSessionAndCheckAccess(
  sessionId: string,
  userId: string
) {
  const expSession = await prisma.expenseSession.findUnique({
    where: { id: sessionId },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      invitee: { select: { id: true, name: true, image: true } },
      expenses: {
        include: { addedBy: { select: { id: true, name: true, image: true } } },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!expSession) return { error: "Session introuvable.", status: 404 };

  const isMember =
    expSession.creatorId === userId || expSession.inviteeId === userId;
  if (!isMember) return { error: "Accès refusé.", status: 403 };

  return { expSession };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const result = await getSessionAndCheckAccess(id, session.user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.expSession);
}

const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  defaultSplitRatio: z.number().min(0).max(1).optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const expSession = await prisma.expenseSession.findUnique({
      where: { id },
    });
    if (!expSession) {
      return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
    }
    if (expSession.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Seul le créateur peut modifier la session." }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSessionSchema.parse(body);

    const updated = await prisma.expenseSession.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        invitee: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides.", issues: error.issues },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
