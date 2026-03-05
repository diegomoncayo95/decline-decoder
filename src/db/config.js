// Database configuration — reads from .env
// For Aurora PostgreSQL: set DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME in .env

export const DbHost     = process.env.DB_HOST     || "localhost";
export const DbPort     = process.env.DB_PORT     || "5432";
export const DbUsername = process.env.DB_USERNAME;
export const DbPassword = process.env.DB_PASSWORD;
export const DbName     = process.env.DB_NAME     || "decline_decoder";
