import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL is not set in environment or .env file.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const email = args[0];
  const name = args[1] || "Administrator";
  const password = args[2];

  if (!email) {
    console.log(`
Usage:
  npx tsx scripts/create-admin.ts <email> [name] [password]

Examples:
  1. Promote an existing user to ADMIN:
     npx tsx scripts/create-admin.ts alex@example.com

  2. Create a new ADMIN user:
     npx tsx scripts/create-admin.ts admin@worklink.com "Main Admin" "SuperSecretPass123!"
`);
    process.exit(0);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, cleanEmail),
  });

  if (existingUser) {
    // Promote existing user
    await db
      .update(schema.users)
      .set({
        role: "ADMIN",
        isSuspended: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existingUser.id));

    console.log(`Successfully promoted existing user '${cleanEmail}' to role ADMIN!`);
    console.log(`User ID: ${existingUser.id}`);
  } else {
    // Create new admin user
    if (!password) {
      console.error(
        `Error: User '${cleanEmail}' does not exist yet. Please provide a password as the third argument to create a new admin account.`
      );
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email: cleanEmail,
        name,
        passwordHash,
        role: "ADMIN",
        isSuspended: false,
      })
      .returning();

    console.log(`Successfully created new ADMIN user '${cleanEmail}'!`);
    console.log(`User ID: ${newUser.id}`);
  }

  console.log(`\nYou can now log in at: /jo`);
}

main().catch((err) => {
  console.error("Admin setup failed:", err);
  process.exit(1);
});
