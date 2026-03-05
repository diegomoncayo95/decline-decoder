// Database configuration — mirrors salesforce config/config.go pattern
// Reads DB credentials from environment variables set in .env

export const DbHostname = process.env.DB_HOSTNAME || "localhost";
export const DbPort     = process.env.DB_PORT     || "3306";
export const DbUsername = process.env.DB_USERNAME;
export const DbPassword = process.env.DB_PASSWORD;
export const DbName     = process.env.DB_NAME     || "decline_decoder";

export function validateConfig() {
  const missing = [];
  if (!DbUsername) missing.push("DB_USERNAME");
  if (!DbPassword) missing.push("DB_PASSWORD");

  if (missing.length > 0) {
    console.error(`Missing required database config: ${missing.join(", ")} must be set in .env`);
    process.exit(1);
  }

  console.log(`DB settings: mysql ${DbHostname}:${DbPort}/${DbName} (user: ${DbUsername})`);
}
