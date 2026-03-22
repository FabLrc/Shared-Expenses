import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  defaultSplitRatio: z.number().min(0).max(1).default(0.5),
  currency: z.string().length(3).default("EUR"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const sessions = await prisma.expenseSession.findMany({
    where: {
      OR: [
        { creatorId: session.user.id },
        { inviteeId: session.user.id },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      invitee: { select: { id: true, name: true, image: true } },
      expenses: { select: { id: true, amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSessionSchema.parse(body);

    const expenseSession = await prisma.expenseSession.create({
      data: {
        title: data.title,
        defaultSplitRatio: data.defaultSplitRatio,
        currency: data.currency,
        shareCode: nanoid(8),
        creatorId: session.user.id,
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        invitee: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(expenseSession, { status: 201 });
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
