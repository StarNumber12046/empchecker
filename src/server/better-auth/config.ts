import { betterAuth, discord } from "better-auth";
import { env } from "~/env";

export const auth = betterAuth({
  socialProviders: {
    discord: {
      clientId: env.BETTER_AUTH_DISCORD_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_DISCORD_CLIENT_SECRET,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
