import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy singleton — the Neon connection is only established when a query is
// actually executed, so the module can be safely imported without DATABASE_URL
// being set at startup (e.g. during Next.js middleware cold-start on public routes).
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is required");
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

// Proxy so callers can write `db.query.xxx` as normal — resolution is deferred.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export * from "./schema";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
