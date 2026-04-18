import "dotenv/config";
import { getDb } from "@jobhunter/db";

async function main() {
  const db = getDb();
  console.log("JobHunter CLI ready.");
  console.log("DB connected:", !!db);
  // Phase 2: ingestion commands
  // Phase 3: evaluation commands
  // Phase 4: tailoring commands
  // Phase 5: review queue
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
