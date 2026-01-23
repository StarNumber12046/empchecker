import { ImageChecker } from "~/app/_components/image-checker";
import { LoginButton } from "~/app/_components/login-button";
import { SignOutButton } from "~/app/_components/sign-out-button";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getSession();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Cat <span className="text-[hsl(280,100%,70%)]">Pose</span> DB
          </h1>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-2xl text-white">
                {session ? (
                  <span>Welcome, {session.user?.name}</span>
                ) : (
                  <span>Please sign in to check poses</span>
                )}
              </p>
              {!session ? (
                <LoginButton />
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <ImageChecker />
                  <SignOutButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
