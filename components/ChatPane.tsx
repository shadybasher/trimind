"use client";

import { useState } from "react";
import Image from "next/image";
import { useGetMessages } from "@/hooks/queries/useMessages";
import { useUIStore } from "@/lib/stores/useUIStore";
import { getModelsByProvider, getProviderInfo, type ProviderId, type AIModel } from "@/lib/models";
import { ChevronDown, Eye, EyeOff, Volume2 } from "lucide-react";
import * as Select from "@radix-ui/react-select";

interface ChatPaneProps {
  providerId: ProviderId;
  sessionId: string;
}

type ModelState = "active" | "silent" | "observe";

export function ChatPane({ providerId, sessionId }: ChatPaneProps) {
  const provider = getProviderInfo(providerId);
  const models = getModelsByProvider(providerId);
  const [selectedModel, setSelectedModel] = useState<AIModel>(models[0]);

  // Get messages for this session
  const { data: messages = [], isLoading } = useGetMessages(sessionId);

  // Get and set model state from Zustand store
  const modelStates = useUIStore((state) => state.modelStates);
  const setModelState = useUIStore((state) => state.setModelState);

  const currentState: ModelState =
    providerId === "openai"
      ? modelStates.gpt
      : providerId === "google"
        ? modelStates.gemini
        : modelStates.claude;

  const handleStateChange = (newState: ModelState) => {
    const storeKey =
      providerId === "openai" ? "gpt" : providerId === "google" ? "gemini" : "claude";
    setModelState(storeKey, newState);
  };

  // Filter messages for this pane (for now, show all)
  // In full implementation, messages would be tagged by provider
  const paneMessages = messages;

  return (
    <div className="flex h-full min-h-[500px] flex-col">
      {/* Header: Logo + Provider Name + Sub-Model Selector */}
      <div className="border-b border-slate-200 p-4 dark:border-slate-700">
        <div className="mb-3 flex items-center gap-3">
          {/* Provider Logo */}
          <div className="relative h-8 w-8 flex-shrink-0">
            <Image
              src={provider.logoPath}
              alt={`${provider.displayName} logo`}
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Provider Name */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {provider.displayName}
          </h3>
        </div>

        {/* Sub-Model Selector */}
        <Select.Root
          value={selectedModel.id}
          onValueChange={(value) =>
            setSelectedModel(models.find((m) => m.id === value) || models[0])
          }
        >
          <Select.Trigger className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">
            <Select.Value>{selectedModel.displayName}</Select.Value>
            <Select.Icon>
              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <Select.Viewport className="p-1">
                {models.map((model) => (
                  <Select.Item
                    key={model.id}
                    value={model.id}
                    className="relative cursor-pointer rounded px-3 py-2 text-sm text-slate-900 outline-none hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                  >
                    <Select.ItemText>
                      <div>
                        <div className="font-medium">{model.displayName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {model.description}
                        </div>
                      </div>
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* State Buttons: Active / Silent / Observe */}
      <div className="border-b border-slate-200 p-3 dark:border-slate-700">
        <div className="flex gap-2">
          {/* Active Button */}
          <button
            onClick={() => handleStateChange("active")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentState === "active"
                ? "bg-green-600 text-white dark:bg-green-500"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>Active</span>
          </button>

          {/* Silent Button */}
          <button
            onClick={() => handleStateChange("silent")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentState === "silent"
                ? "bg-orange-600 text-white dark:bg-orange-500"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            <EyeOff className="h-4 w-4" />
            <span>Silent</span>
          </button>

          {/* Observe Button */}
          <button
            onClick={() => handleStateChange("observe")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentState === "observe"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Observe</span>
          </button>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400"></div>
          </div>
        ) : paneMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No messages yet</p>
            <p className="mt-1 text-xs">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paneMessages.map((message) => (
              <div
                key={message.id}
                data-role={message.role}
                className={`rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-slate-50 dark:bg-slate-800/50"
                }`}
              >
                <div className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {message.role === "user" ? "You" : provider.displayName}
                </div>
                <div className="whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                  {message.content}
                </div>
                <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current State Indicator */}
      <div className="border-t border-slate-200 p-2 dark:border-slate-700">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div
            className={`h-2 w-2 rounded-full ${
              currentState === "active"
                ? "bg-green-500"
                : currentState === "silent"
                  ? "bg-orange-500"
                  : "bg-blue-500"
            }`}
          ></div>
          <span className="capitalize">{currentState}</span>
        </div>
      </div>
    </div>
  );
}
