"use client";

import { useState } from "react";
import { useSendMessage } from "@/hooks/queries/useMessages";
import { Send } from "lucide-react";
import { AI_PROVIDERS } from "@/lib/models";

interface ManagerConsoleProps {
  sessionId: string;
}

export function ManagerConsole({ sessionId }: ManagerConsoleProps) {
  const [message, setMessage] = useState("");
  const { mutate: sendMessage, isPending } = useSendMessage();

  const handleSend = (_target: "chatgpt" | "gemini" | "claude" | "all") => {
    if (!message.trim() || isPending) return;

    // For now, send to the session
    // In full implementation, this would route to specific provider sessions
    sendMessage(
      {
        sessionId,
        message: message.trim(),
      },
      {
        onSuccess: () => {
          setMessage("");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend("all");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Input Area */}
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here... (Shift+Enter for new line, Enter to send)"
          disabled={isPending}
          className="w-full resize-none rounded-lg border border-slate-300 bg-white p-4 pr-12 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          rows={4}
          maxLength={10000}
        />
        <div className="absolute bottom-2 right-2 text-xs text-slate-400 dark:text-slate-500">
          {message.length}/10000
        </div>
      </div>

      {/* Send Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Send to ChatGPT */}
        <button
          onClick={() => handleSend("chatgpt")}
          disabled={!message.trim() || isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus:ring-emerald-400"
        >
          <Send className="h-4 w-4" />
          <span>Send to {AI_PROVIDERS.openai.displayName}</span>
        </button>

        {/* Send to Gemini */}
        <button
          onClick={() => handleSend("gemini")}
          disabled={!message.trim() || isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
        >
          <Send className="h-4 w-4" />
          <span>Send to {AI_PROVIDERS.google.displayName}</span>
        </button>

        {/* Send to Claude */}
        <button
          onClick={() => handleSend("claude")}
          disabled={!message.trim() || isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-400"
        >
          <Send className="h-4 w-4" />
          <span>Send to {AI_PROVIDERS.anthropic.displayName}</span>
        </button>

        {/* Send to All */}
        <button
          onClick={() => handleSend("all")}
          disabled={!message.trim() || isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-600 dark:focus:ring-purple-400"
        >
          <Send className="h-4 w-4" />
          <span>Send to All</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {isPending && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400"></div>
          <span>Sending message...</span>
        </div>
      )}
    </div>
  );
}
