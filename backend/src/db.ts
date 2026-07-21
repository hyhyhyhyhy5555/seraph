import { Pool, type QueryResultRow } from "pg";

import { env } from "./env";

export const pool = new Pool(
  env.databaseUrl
    ? {
        connectionString: env.databaseUrl,
        max: 10
      }
    : {
        host: env.pgHost,
        port: env.pgPort,
        database: env.pgDatabase,
        user: env.pgUser,
        password: env.pgPassword,
        max: 10
      }
);

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params);
}

export async function closePool() {
  await pool.end();
}
