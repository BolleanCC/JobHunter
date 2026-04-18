import "dotenv/config";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./client.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const db = getDb();
  const migrationsFolder = path.join(__dirname, "../migrations");
  migrate(db, { migrationsFolder });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
