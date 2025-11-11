import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-slate-900">Trimind V-Next</h1>
        <p className="mb-8 text-xl text-slate-600">
          AI-powered conversation platform with Google-level quality standards
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border-2 border-slate-900 px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-100"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-12 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-3 text-2xl font-bold text-slate-900">Features</h2>
          <ul className="space-y-2 text-left text-slate-700">
            <li>✅ Secure authentication with Clerk</li>
            <li>✅ Protected routes by default</li>
            <li>✅ PostgreSQL database with Prisma</li>
            <li>✅ Redis-powered async task queue</li>
            <li>✅ 100% test coverage with E2E testing</li>
            <li>✅ CI/CD pipeline with 0 errors policy</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
