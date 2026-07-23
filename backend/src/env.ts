import "dotenv/config";

function toNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function toCsv(value: string | undefined) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const databaseUrl = process.env.DATABASE_URL?.trim() || undefined;
const corsOrigins = toCsv(process.env.CORS_ORIGINS);

if (
  nodeEnv === "production" &&
  !databaseUrl &&
  (!process.env.PGHOST ||
    !process.env.PGDATABASE ||
    !process.env.PGUSER ||
    !process.env.PGPASSWORD)
) {
  throw new Error(
    "Production requires DATABASE_URL or explicit PGHOST, PGDATABASE, PGUSER, and PGPASSWORD."
  );
}

if (nodeEnv === "production" && corsOrigins.length === 0) {
  throw new Error("Production requires at least one CORS_ORIGINS value.");
}

export const env = {
  nodeEnv,
  port: toNumber(process.env.PORT, 4000),
  databaseUrl,
  pgHost: process.env.PGHOST ?? "localhost",
  pgPort: toNumber(process.env.PGPORT, 5432),
  pgDatabase: process.env.PGDATABASE ?? "seraph",
  pgUser: process.env.PGUSER ?? "seraph",
  pgPassword: process.env.PGPASSWORD ?? "seraph",
  corsOrigins,
  trustProxy: toBoolean(process.env.TRUST_PROXY)
};
