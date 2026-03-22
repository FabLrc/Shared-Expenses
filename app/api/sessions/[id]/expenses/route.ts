import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addExpenseSchema = z.object({
  label: z.string().min(1).max(200),
  amount: z.number().positive(),
  splitRatio: z.number().min(0).max(1).nullable().optional(),
  date: z.string().datetime().optional(),
});

export async function POST(
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

    const isMember =
      expSession.creatorId === session.user.id ||
      expSession.inviteeId === session.user.id;
    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    if (expSession.status === "CLOSED") {
      return NextResponse.json(
        { error: "La session est fermée." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = addExpenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        label: data.label,
        amount: data.amount,
        splitRatio: data.splitRatio ?? null,
        date: data.date ? new Date(data.date) : new Date(),
        sessionId: id,
        addedById: session.user.id,
      },
      include: {
        addedBy: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
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
