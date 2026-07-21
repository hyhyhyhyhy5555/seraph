import "dotenv/config";

function toNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://seraph:seraph@localhost:5432/seraph",
  pgHost: process.env.PGHOST ?? "localhost",
  pgPort: toNumber(process.env.PGPORT, 5432),
  pgDatabase: process.env.PGDATABASE ?? "seraph",
  pgUser: process.env.PGUSER ?? "seraph",
  pgPassword: process.env.PGPASSWORD ?? "seraph"
};
