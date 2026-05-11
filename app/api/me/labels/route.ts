import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q") || "";

  const labels = await prisma.expense.findMany({
    where: {
      label: { contains: q, mode: "insensitive" },
      session: {
        OR: [{ creatorId: userId }, { inviteeId: userId }],
      },
    },
    select: { label: true },
    distinct: ["label"],
    take: 10,
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ labels: labels.map((e) => e.label) });
}
