import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db-schema";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/akademitrading";

export const db = drizzle(postgres(connectionString, { max: 5 }), { schema });
export * from "./db-schema";
