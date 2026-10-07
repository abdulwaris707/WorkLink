import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function runMigrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set. Please provide DATABASE_URL in your environment.");
    process.exit(1);
  }

  console.log("Running Drizzle migrations against Neon PostgreSQL...");
  const sql = neon(dbUrl);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Drizzle migrations completed successfully!");
}

runMigrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
