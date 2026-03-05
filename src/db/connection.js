// MySQL connection pool — mirrors salesforce gorm/gorm.go InitDB() pattern
import mysql from "mysql2/promise";
import { DbHostname, DbPort, DbUsername, DbPassword, DbName, validateConfig } from "./config.js";

// Singleton pool — mirrors `var DB *gorm.DB` in gorm.go
let DB;

// InitDB — mirrors gorm.go InitDB()
// Opens the connection pool and verifies connectivity before returning.
export async function InitDB() {
  validateConfig();

  DB = mysql.createPool({
    host:             DbHostname,
    port:             Number(DbPort),
    user:             DbUsername,
    password:         DbPassword,
    database:         DbName,
    waitForConnections: true,
    connectionLimit:  10,
    timezone:         "Z"
  });

  // Verify the connection is live (mirrors gorm.New returning an error)
  const conn = await DB.getConnection();
  conn.release();
  console.log(`Connected to MySQL at ${DbHostname}:${DbPort}/${DbName}`);

  return DB;
}

export { DB };
