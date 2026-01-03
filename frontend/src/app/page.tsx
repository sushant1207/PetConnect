import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col items-center gap-8 py-24 px-8 text-center sm:px-16">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          PetConnect
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">
          Connect with vets, track your pets, and support animal welfare — all in one place.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-black/10 px-6 py-3 text-foreground transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
}
