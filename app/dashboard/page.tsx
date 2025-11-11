import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ManagerConsole } from "@/components/ManagerConsole";
import { ChatPane } from "@/components/ChatPane";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccountSetupLoader } from "@/components/AccountSetupLoader";
import { getUserByClerkIdSafe } from "@/lib/user";
import { getOrCreateSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user's database ID (safe - handles race condition with webhook)
  const dbUserId = await getUserByClerkIdSafe(userId);

  // If user doesn't exist yet, show loading UI while polling
  // This handles the race condition between Clerk auth and webhook completion
  if (!dbUserId) {
    return <AccountSetupLoader clerkId={userId} />;
  }

  // User exists - proceed with normal dashboard
  const sessionId = await getOrCreateSession(dbUserId);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trimind V-Next</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid Layout */}
      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto grid h-full w-full max-w-[1920px] grid-rows-[auto_1fr] gap-4">
          {/* Top Section: ManagerConsole (Full Width) */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <ManagerConsole sessionId={sessionId} />
          </section>

          {/* Bottom Section: 3 ChatPane Components (3 Equal Columns) */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* ChatGPT Pane */}
            <div className="flex min-h-[500px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <ChatPane providerId="openai" sessionId={sessionId} />
            </div>

            {/* Gemini Pane */}
            <div className="flex min-h-[500px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <ChatPane providerId="google" sessionId={sessionId} />
            </div>

            {/* Claude Pane */}
            <div className="flex min-h-[500px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <ChatPane providerId="anthropic" sessionId={sessionId} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
