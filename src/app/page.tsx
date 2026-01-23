import { ImageChecker } from "~/app/_components/image-checker";
import { LoginButton } from "~/app/_components/login-button";
import { SignOutButton } from "~/app/_components/sign-out-button";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getSession();

  return (
    <HydrateClient>
      <main className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-md dark:border-zinc-700/50 dark:bg-zinc-900/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-zinc-100">
                <span className="text-sm font-bold text-white dark:text-zinc-900">
                  E
                </span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                EMP Checker
              </h1>
            </div>
            {session && (
              <div className="text-sm text-slate-600 dark:text-zinc-400">
                {session.user?.name}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pt-24 pb-16">
          <div className="mx-auto max-w-2xl">
            {!session ? (
              // Login Screen
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-12 text-center">
                  <h2 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white">
                    Verify Your Images
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-zinc-400">
                    Check and validate EMPs uniqueness with EMP Checker
                  </p>
                </div>
                <LoginButton />
              </div>
            ) : (
              // Authenticated Screen
              <div className="space-y-8">
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                    Image Verification
                  </h2>
                  <p className="text-slate-600 dark:text-zinc-400">
                    Upload an image to check its uniqueness
                  </p>
                </div>
                <ImageChecker />
                <div className="flex justify-center pt-4">
                  <SignOutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
