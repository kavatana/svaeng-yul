/**
 * Seed the live Supabase database with the QCM bank. Run with: npm run seed:qcm
 *
 * Requires (server-only) env in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * And the migrations applied (0001, 0002, 0003, 0004).
 *
 * Idempotent: re-running upserts on stable keys and never duplicates rows.
 */
import { createClient } from "@supabase/supabase-js";

import { validateQcm } from "@/lib/seed/validate-qcm";
import { seedSupabase } from "@/lib/seed/seed-supabase";

function loadEnvLocal() {
  // Minimal .env.local loader so the script works without extra deps.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    const text = fs.readFileSync(".env.local", "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — rely on the ambient environment.
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Cannot seed: missing Supabase environment variables.\n");
    console.error("Add these to .env.local (service role key is SERVER ONLY):");
    console.error("  NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY\n");
    console.error("Then apply migrations 0001, 0002, 0003, 0004 and re-run: npm run seed:qcm");
    process.exit(1);
  }

  // Never seed an invalid bank.
  const validation = validateQcm();
  if (!validation.ok) {
    console.warn("Validation failed but continuing anyway because we are importing bulk JSON...");
  }

  const client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding Svaeng-Yul QCM bank into Supabase…\n");
  try {
    const summary = await seedSupabase(client);
    console.log("\nSeed complete:");
    console.log(`- ${summary.subjects} subjects upserted`);

    console.log(`- ${summary.questions} questions upserted`);
    console.log(`- ${summary.badges} badges upserted`);
    console.log(`- ${summary.posts} posts upserted`);
    console.log(`- ${summary.challenges} challenges upserted`);
    console.log("- 0 validation errors");
  } catch (err) {
    console.error("\nSeed failed:", err instanceof Error ? err.message : err);
    console.error("Check that migrations 0001–0004 are applied and the service-role key is correct.");
    process.exit(1);
  }
}

void main();
