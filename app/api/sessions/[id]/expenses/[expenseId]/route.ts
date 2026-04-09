import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateExpenseSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  splitRatio: z.number().min(0).max(1).nullable().optional(),
  date: z.string().datetime().optional(),
});

type Params = { params: Promise<{ id: string; expenseId: string }> };

class TxError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id, expenseId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateExpenseSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id: expenseId },
        include: { session: true },
      });

      if (!expense || expense.sessionId !== id)
        throw new TxError("Dépense introuvable.", 404);
      if (expense.addedById !== userId)
        throw new TxError("Vous ne pouvez modifier que vos propres dépenses.", 403);
      if (expense.session.status === "CLOSED")
        throw new TxError("La session est fermée.", 400);

      return tx.expense.update({
        where: { id: expenseId },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
        },
        include: {
          addedBy: { select: { id: true, name: true, image: true } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof TxError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, expenseId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id: expenseId },
        include: { session: true },
      });

      if (!expense || expense.sessionId !== id)
        throw new TxError("Dépense introuvable.", 404);
      if (expense.addedById !== userId)
        throw new TxError("Vous ne pouvez supprimer que vos propres dépenses.", 403);
      if (expense.session.status === "CLOSED")
        throw new TxError("La session est fermée.", 400);

      await tx.expense.delete({ where: { id: expenseId } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof TxError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
