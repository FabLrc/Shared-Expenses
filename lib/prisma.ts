/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  const connectionString =
    process.env.POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL ??
    "postgresql://localhost/splitmate";

  const { Pool } = require("pg");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool as any);
  return new (PrismaClient as any)({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
