import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Trimind V-Next</h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Welcome, {user?.firstName || "User"}!
          </h2>
          <p className="text-slate-600">
            You are successfully authenticated. Your user ID is:{" "}
            <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm">{userId}</code>
          </p>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 font-semibold text-slate-900">User Information:</h3>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>
                <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
              </li>
              <li>
                <strong>Name:</strong> {user?.firstName} {user?.lastName}
              </li>
              <li>
                <strong>Created:</strong>{" "}
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <p className="text-sm text-slate-500">
              This is a protected route. Only authenticated users can see this page.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
