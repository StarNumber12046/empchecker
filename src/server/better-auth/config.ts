import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "~/env";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...schema,
    },
  }),
  socialProviders: {
    discord: {
      clientId: env.BETTER_AUTH_DISCORD_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_DISCORD_CLIENT_SECRET,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  trustedOrigins: [env.BETTER_AUTH_URL].filter(Boolean) as string[],
});

export type Session = typeof auth.$Infer.Session;
