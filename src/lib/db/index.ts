import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  console.warn("DATABASE_URL is not set. Ensure Neon PostgreSQL is connected.");
}

// neon-http connection for serverless stateless execution
const sql = neon(connectionString || "");

export const db = drizzle(sql, { schema });
export { schema };
