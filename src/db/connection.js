// PostgreSQL connection pool for Aurora
import pg from "pg";
const { Pool } = pg;

let DB;

export async function InitDB() {
  const required = ["DB_HOST", "DB_USERNAME", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing DB config: ${missing.join(", ")} — running in MOCK MODE (no database)`);
    return null;
  }

  DB = new Pool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT || 5432),
    user:     process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:      process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
    max:      10
  });

  // Verify connection
  const client = await DB.connect();
  client.release();
  console.log(`✅ Connected to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`);
  return DB;
}

export { DB };
