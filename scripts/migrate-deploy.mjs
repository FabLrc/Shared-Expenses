import { execSync } from "node:child_process";

// Applies pending Prisma migrations before the Vercel build compiles the app.
//
// - Production builds MUST apply migrations: the generated client queries
//   columns that only exist after a migration. If the database is unreachable,
//   failing the build is intentional — better than deploying a broken app.
// - Preview/development builds share the same buildCommand but have no
//   database credentials (the DB env vars are scoped to Production), so the
//   migrations step is skipped there.
const env = process.env.VERCEL_ENV ?? "local";
if (env !== "production") {
  console.log(`[migrate] Skipped (VERCEL_ENV=${env}).`);
  process.exit(0);
}

console.log("[migrate] Running `prisma migrate deploy`…");
execSync("npx prisma migrate deploy", { stdio: "inherit" });
console.log("[migrate] Database schema is up to date.");
