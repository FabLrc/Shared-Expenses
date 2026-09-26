import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const household = await prisma.household.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!household)
    return NextResponse.json({ error: "Foyer introuvable." }, { status: 404 });

  const isMember = household.members.some(
    (m) => m.userId === session.user!.id
  );
  if (!isMember)
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  return NextResponse.json(household);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId: id, userId: session.user.id },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Seul le propriétaire peut supprimer le foyer." },
      { status: 403 }
    );
  }

  await prisma.household.delete({ where: { id } });

  revalidatePath("/households");
  revalidatePath("/dashboard");

  return new NextResponse(null, { status: 204 });
}
