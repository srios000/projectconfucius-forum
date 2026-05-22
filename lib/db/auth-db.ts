import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./auth-schema";

const connectionString = process.env.AUTH_DATABASE_URL;
if (!connectionString) throw new Error("AUTH_DATABASE_URL is not set (auth_sibling connection)");

const client = postgres(connectionString, { prepare: false, max: 5 });
export const authDb = drizzle(client, { schema: authSchema });