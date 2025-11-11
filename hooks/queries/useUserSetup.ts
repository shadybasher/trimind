"use client";

import { useQuery } from "@tanstack/react-query";

interface UserCheckResponse {
  exists: boolean;
  userId: string | null;
}

/**
 * TanStack Query hook to poll for user creation in database
 *
 * This hook handles the race condition between Clerk authentication and webhook completion.
 * It polls the /api/user/check endpoint with exponential backoff until the user exists.
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, isError } = useUserSetup(clerkId);
 *
 * if (data?.exists) {
 *   // User found - can proceed
 * }
 * ```
 *
 * @param clerkId - The Clerk user ID to check
 * @returns TanStack Query result with user existence data
 */
export function useUserSetup(clerkId: string) {
  return useQuery<UserCheckResponse>({
    queryKey: ["user-setup", clerkId],
    queryFn: async (): Promise<UserCheckResponse> => {
      const response = await fetch(`/api/user/check?clerkId=${encodeURIComponent(clerkId)}`);

      if (!response.ok) {
        throw new Error("Failed to check user status");
      }

      const data: UserCheckResponse = await response.json();

      // Throw error to trigger retry if user doesn't exist yet
      if (!data.exists) {
        throw new Error("User not ready yet - webhook still processing");
      }

      return data;
    },
    retry: 30, // Retry up to 30 times (30 seconds with 1s interval)
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, up to max 10s
      return Math.min(1000 * 2 ** attemptIndex, 10000);
    },
    refetchInterval: (query) => {
      // Stop polling once user is found
      return query.state.data?.exists ? false : 1000;
    },
    refetchIntervalInBackground: false,
    // Don't cache this query - always fresh check
    staleTime: 0,
    gcTime: 0,
  });
}
