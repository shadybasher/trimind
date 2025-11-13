"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface Message {
  id: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface SendMessageRequest {
  sessionId: string;
  message: string;
}

interface SendMessageResponse {
  success: boolean;
  message: string;
  messageId: string;
  timestamp: string;
}

// Query key factory
export const messagesKeys = {
  all: ["messages"] as const,
  bySession: (sessionId: string) => ["messages", sessionId] as const,
};

// Hook to fetch messages for a session
export function useGetMessages(sessionId: string) {
  return useQuery({
    queryKey: messagesKeys.bySession(sessionId),
    queryFn: async (): Promise<Message[]> => {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      return response.json();
    },
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds for new AI responses
  });
}

// Hook to send a message with optimistic updates
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      return response.json();
    },

    // Optimistic update: Show user message immediately
    onMutate: async (request: SendMessageRequest) => {
      const queryKey = messagesKeys.bySession(request.sessionId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

      // Optimistically update to show user message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sessionId: request.sessionId,
        userId: "current-user", // Temporary ID
        role: "user",
        content: request.message,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(queryKey, (old) => [...(old || []), optimisticMessage]);

      // Return context with previous value
      return { previousMessages, optimisticMessage };
    },

    // On success: Replace optimistic message with real one
    onSuccess: (data, variables, context) => {
      const queryKey = messagesKeys.bySession(variables.sessionId);

      queryClient.setQueryData<Message[]>(queryKey, (old) => {
        if (!old) return old;

        // Replace temp message with real message from server
        return old.map((msg) =>
          msg.id === context?.optimisticMessage.id
            ? {
                ...msg,
                id: data.messageId,
                createdAt: data.timestamp,
              }
            : msg
        );
      });

      // Refetch to get any server updates
      queryClient.invalidateQueries({
        queryKey: messagesKeys.bySession(variables.sessionId),
      });
    },

    // On error: Rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messagesKeys.bySession(variables.sessionId),
          context.previousMessages
        );
      }
    },
  });
}
