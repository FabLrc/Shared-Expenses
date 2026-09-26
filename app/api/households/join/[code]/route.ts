import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Params = { params: Promise<{ code: string }> };

// GET — fetch household info by shareCode (public, just the name)
export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;

  const household = await prisma.household.findUnique({
    where: { shareCode: code },
    select: {
      id: true,
      name: true,
      createdBy: { select: { name: true } },
      _count: { select: { members: true } },
    },
  });

  if (!household)
    return NextResponse.json({ error: "Foyer introuvable." }, { status: 404 });

  return NextResponse.json(household);
}

// POST — join a household by shareCode (idempotent)
export async function POST(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const household = await prisma.household.findUnique({
    where: { shareCode: code },
  });
  if (!household)
    return NextResponse.json({ error: "Foyer introuvable." }, { status: 404 });

  await prisma.householdMember.upsert({
    where: {
      householdId_userId: {
        householdId: household.id,
        userId: session.user.id,
      },
    },
    create: {
      householdId: household.id,
      userId: session.user.id,
      role: "MEMBER",
    },
    update: {},
  });

  revalidatePath("/households");
  revalidatePath("/dashboard");

  return NextResponse.json({ householdId: household.id }, { status: 200 });
}
