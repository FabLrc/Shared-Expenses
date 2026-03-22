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

export async function PUT(req: NextRequest, { params }: Params) {
  const { id, expenseId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { session: true },
    });

    if (!expense || expense.sessionId !== id) {
      return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
    }
    if (expense.addedById !== session.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres dépenses." }, { status: 403 });
    }
    if (expense.session.status === "CLOSED") {
      return NextResponse.json({ error: "La session est fermée." }, { status: 400 });
    }

    const body = await req.json();
    const data = updateExpenseSchema.parse(body);

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        addedBy: { select: { id: true, name: true, image: true } },
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

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, expenseId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { session: true },
  });

  if (!expense || expense.sessionId !== id) {
    return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
  }
  if (expense.addedById !== session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres dépenses." }, { status: 403 });
  }
  if (expense.session.status === "CLOSED") {
    return NextResponse.json({ error: "La session est fermée." }, { status: 400 });
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  return new NextResponse(null, { status: 204 });
}
