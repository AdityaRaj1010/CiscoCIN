import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `next dev`/`next build` load .env.local automatically; a plain `node`
// script does not. Without this, DATABASE_URL can be sitting right there
// in .env.local and this script will still say "not set". Load it
// ourselves — .env.local wins over .env, and neither overrides a value
// already set in the real environment (e.g. `$env:DATABASE_URL=...`).
function loadEnvFile(filename) {
  const filePath = path.join(__dirname, "..", filename);
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(".env");
loadEnvFile(".env.local");

// SECURITY NOTE: this file previously had a live Supabase host + database
// password hardcoded here. That credential must be treated as compromised
// (it was committed to the repo) — rotate it in the Supabase dashboard
// before relying on this project again. Per the build spec's own rule
// ("do not invent, guess, or hardcode any API key, token, org id, or URL"),
// this script now reads DATABASE_URL from the environment, same as
// lib/db.ts, and refuses to run without it.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set. Add it to cin/.env or cin/.env.local, or export it, before running migrations.");
  console.error("   e.g. DATABASE_URL=postgres://postgres:<password>@<host>:5432/postgres node scripts/run-migrations.mjs");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

const MIGRATIONS_DIR = path.join(__dirname, "../supabase/migrations");

async function run() {
  try {
    console.log("Connecting to database...");

    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const migrationSql = fs.readFileSync(filePath, "utf8");
      console.log(`Running migration ${file}...`);
      await sql.unsafe(migrationSql);
    }
    console.log("✅ Schema up to date.");

    const seedSqlPath = path.join(__dirname, "../supabase/seed.sql");
    const seedSql = fs.readFileSync(seedSqlPath, "utf8");
    console.log("Running seed data script seed.sql...");
    await sql.unsafe(seedSql);
    console.log("✅ Seed data inserted successfully.");

    const tenants = await sql`SELECT slug, name, features FROM tenants`;
    console.log("Active tenants in DB:", tenants);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
