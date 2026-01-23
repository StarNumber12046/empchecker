import { type Config } from "drizzle-kit";
import "dotenv/config";
console.log("URL exists:", !!process.env.TURSO_CONNECTION_URL);
console.log("Token exists:", !!process.env.TURSO_AUTH_TOKEN);
export default {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  tablesFilter: ["empchecker_*"],
} satisfies Config;
