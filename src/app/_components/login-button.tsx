"use client";

import { authClient } from "~/server/better-auth/client";

export function LoginButton() {
  return (
    <button
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
      onClick={async () => {
        await authClient.signIn.social({
          provider: "discord",
          callbackURL: "/",
        });
      }}
    >
      Sign in with Discord
    </button>
  );
}
