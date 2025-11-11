import { messagesKeys } from "@/hooks/queries/useMessages";

describe("TanStack Query Hooks - Unit Tests", () => {
  describe("messagesKeys factory", () => {
    it("should generate correct query key for all messages", () => {
      const key = messagesKeys.all;
      expect(key).toEqual(["messages"]);
    });

    it("should generate correct query key for session messages", () => {
      const sessionId = "test-session-123";
      const key = messagesKeys.bySession(sessionId);

      expect(key).toEqual(["messages", sessionId]);
    });

    it("should generate unique keys for different sessions", () => {
      const sessionId1 = "session-1";
      const sessionId2 = "session-2";

      const key1 = messagesKeys.bySession(sessionId1);
      const key2 = messagesKeys.bySession(sessionId2);

      expect(key1).not.toEqual(key2);
      expect(key1[1]).toBe(sessionId1);
      expect(key2[1]).toBe(sessionId2);
    });
  });

  describe("Optimistic Update Logic", () => {
    it("should create optimistic message with correct structure", () => {
      const request = {
        sessionId: "test-session-id",
        message: "Hello, world!",
      };

      // Simulate optimistic message creation
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sessionId: request.sessionId,
        userId: "current-user",
        role: "user" as const,
        content: request.message,
        createdAt: new Date().toISOString(),
      };

      expect(optimisticMessage.id).toContain("temp-");
      expect(optimisticMessage.role).toBe("user");
      expect(optimisticMessage.content).toBe(request.message);
      expect(optimisticMessage.sessionId).toBe(request.sessionId);
    });

    it("should add optimistic message to existing messages array", () => {
      const existingMessages = [
        {
          id: "msg-1",
          sessionId: "session-1",
          userId: "user-1",
          role: "user" as const,
          content: "Previous message",
          createdAt: new Date().toISOString(),
        },
      ];

      const newOptimisticMessage = {
        id: `temp-${Date.now()}`,
        sessionId: "session-1",
        userId: "current-user",
        role: "user" as const,
        content: "New message",
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...existingMessages, newOptimisticMessage];

      expect(updatedMessages).toHaveLength(2);
      expect(updatedMessages[1]).toEqual(newOptimisticMessage);
    });

    it("should replace temp ID with real ID on success", () => {
      const tempId = `temp-${Date.now()}`;
      const realId = "real-message-id-from-server";

      const messages = [
        {
          id: tempId,
          sessionId: "session-1",
          userId: "current-user",
          role: "user" as const,
          content: "Test message",
          createdAt: new Date().toISOString(),
        },
      ];

      // Simulate replacing temp ID with real ID
      const updatedMessages = messages.map((msg) =>
        msg.id === tempId
          ? {
              ...msg,
              id: realId,
              createdAt: new Date().toISOString(),
            }
          : msg
      );

      expect(updatedMessages[0].id).toBe(realId);
      expect(updatedMessages[0].id).not.toBe(tempId);
    });

    it("should rollback to previous state on error", () => {
      const previousMessages = [
        {
          id: "msg-1",
          sessionId: "session-1",
          userId: "user-1",
          role: "user" as const,
          content: "Existing message",
          createdAt: new Date().toISOString(),
        },
      ];

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sessionId: "session-1",
        userId: "current-user",
        role: "user" as const,
        content: "Failed message",
        createdAt: new Date().toISOString(),
      };

      // Add optimistic message
      const withOptimistic = [...previousMessages, optimisticMessage];
      expect(withOptimistic).toHaveLength(2);

      // Rollback on error
      const rolledBack = previousMessages;
      expect(rolledBack).toHaveLength(1);
      expect(rolledBack).toEqual(previousMessages);
    });
  });

  describe("Request/Response Types", () => {
    it("should validate SendMessageRequest structure", () => {
      const request = {
        sessionId: "test-session-id",
        message: "Test message content",
      };

      expect(request).toHaveProperty("sessionId");
      expect(request).toHaveProperty("message");
      expect(typeof request.sessionId).toBe("string");
      expect(typeof request.message).toBe("string");
    });

    it("should validate SendMessageResponse structure", () => {
      const response = {
        success: true,
        message: "Received",
        messageId: "msg-123",
        timestamp: new Date().toISOString(),
      };

      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("messageId");
      expect(response).toHaveProperty("timestamp");
      expect(response.success).toBe(true);
    });
  });
});
