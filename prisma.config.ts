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
    url: process.env.DATABASE_URL ?? "",
  },
});
