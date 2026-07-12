import postgres from "postgres";

declare global {
  var _sql: postgres.Sql | undefined;
}

export function getDb(): postgres.Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  if (!globalThis._sql) {
    globalThis._sql = postgres(url, {
      ssl: "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  return globalThis._sql;
}
