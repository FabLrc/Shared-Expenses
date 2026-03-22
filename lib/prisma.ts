import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// DATABASE_URL is the standard PostgreSQL connection string provided by
// Vercel Prisma Postgres (and works locally too).
// In Prisma 7, the URL cannot be set in schema.prisma — it must be passed
// via a driver adapter in the PrismaClient constructor.
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  "postgresql://localhost/splitmate";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  const adapter = new PrismaPg({ connectionString });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
