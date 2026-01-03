"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Placeholder submit – integrate API later
    alert(`Logging in as ${email}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-zinc-900">
        <h1 className="mb-6 text-center text-2xl font-semibold text-foreground">Login</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-foreground/30 dark:border-white/15 dark:bg-zinc-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-foreground/30 dark:border-white/15 dark:bg-zinc-800 dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-lg bg-foreground px-4 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-300">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline">
            Create one
          </Link>
        </p>
      </main>
    </div>
  );
}


