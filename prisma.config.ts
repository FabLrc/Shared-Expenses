import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is the direct PostgreSQL connection — required for migrations.
// PRISMA_DATABASE_URL is the prisma:// Accelerate URL — for runtime only, not for migrate.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Mirror the resolution order used by the runtime client (lib/prisma.ts):
    // on Vercel the direct connection is exposed as POSTGRES_URL, while
    // DATABASE_URL may be unset at build time. All of these point to a direct
    // PostgreSQL connection usable by migrations (the app uses adapter-pg, not
    // Accelerate, so the runtime URL is always a direct connection).
    url:
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_URL ??
      "",
  },
});
