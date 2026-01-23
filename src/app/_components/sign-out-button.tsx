"use client";

import { useRouter } from "next/navigation";
import { authClient } from "~/server/better-auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.refresh();
            },
          },
        });
      }}
    >
      Sign out
    </button>
  );
}
