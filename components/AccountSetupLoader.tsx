"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSetup } from "@/hooks/queries/useUserSetup";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface AccountSetupLoaderProps {
  clerkId: string;
}

/**
 * Account Setup Loader Component
 *
 * Handles the race condition between Clerk authentication and webhook database sync.
 * Shows a loading state while polling for user creation, then refreshes the page
 * when the user is found.
 *
 * States:
 * - Loading: "Preparing your account..." with spinner
 * - Error: "Setup taking longer than expected" with retry button
 * - Success: Automatically refreshes to show dashboard
 */
export function AccountSetupLoader({ clerkId }: AccountSetupLoaderProps) {
  const router = useRouter();
  const { data, isError, refetch } = useUserSetup(clerkId);

  // Auto-refresh when user is found
  useEffect(() => {
    if (data?.exists) {
      // User found - refresh the server component to load dashboard
      router.refresh();
    }
  }, [data, router]);

  // Error state - webhook timeout or failure
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3 text-orange-600 dark:text-orange-400">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-xl font-semibold">Account Setup Delayed</h2>
          </div>

          <p className="mb-6 text-slate-600 dark:text-slate-400">
            Your account setup is taking longer than expected. This is usually temporary and
            resolves within a few moments.
          </p>

          <div className="mb-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>What&apos;s happening?</strong> We&apos;re synchronizing your account data.
              This process is usually instant but may take up to a minute.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Loading state - polling for user
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Preparing Your Account
          </h2>

          <p className="text-center text-slate-600 dark:text-slate-400">
            Setting up your workspace... This will only take a moment.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span>Authentication verified</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
            <span>Syncing account data...</span>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This process is automatic and should complete within a few seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
