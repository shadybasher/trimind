// SSOT for AI Models Configuration
// This is the single source of truth for all model data

export interface AIModel {
  id: string;
  providerId: "openai" | "anthropic" | "google";
  providerName: string;
  displayName: string;
  logoPath: string;
  description: string;
}

export const AI_PROVIDERS = {
  openai: {
    id: "openai",
    name: "OpenAI",
    displayName: "ChatGPT",
    logoPath: "/logos/openai.svg",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    displayName: "Claude",
    logoPath: "/logos/anthropic.svg",
  },
  google: {
    id: "google",
    name: "Google",
    displayName: "Gemini",
    logoPath: "/logos/google.svg",
  },
} as const;

export const AI_MODELS: Record<string, AIModel> = {
  // OpenAI Models
  "gpt-5-chat-latest": {
    id: "gpt-5-chat-latest",
    providerId: "openai",
    providerName: "OpenAI",
    displayName: "GPT-5 Chat",
    logoPath: "/logos/openai.svg",
    description: "Latest GPT-5 chat model",
  },
  "o3-2025-04-16": {
    id: "o3-2025-04-16",
    providerId: "openai",
    providerName: "OpenAI",
    displayName: "O3 (2025-04-16)",
    logoPath: "/logos/openai.svg",
    description: "OpenAI O3 model from April 2025",
  },
  "gpt-4.1-2025-04-14": {
    id: "gpt-4.1-2025-04-14",
    providerId: "openai",
    providerName: "OpenAI",
    displayName: "GPT-4.1 (2025-04-14)",
    logoPath: "/logos/openai.svg",
    description: "GPT-4.1 from April 2025",
  },

  // Anthropic Models
  "claude-sonnet-4-5-20250929": {
    id: "claude-sonnet-4-5-20250929",
    providerId: "anthropic",
    providerName: "Anthropic",
    displayName: "Claude Sonnet 4.5",
    logoPath: "/logos/anthropic.svg",
    description: "Claude Sonnet 4.5 from September 2025",
  },
  "claude-opus-4-1-20250805": {
    id: "claude-opus-4-1-20250805",
    providerId: "anthropic",
    providerName: "Anthropic",
    displayName: "Claude Opus 4.1",
    logoPath: "/logos/anthropic.svg",
    description: "Claude Opus 4.1 from August 2025",
  },
  "claude-opus-4-20250514": {
    id: "claude-opus-4-20250514",
    providerId: "anthropic",
    providerName: "Anthropic",
    displayName: "Claude Opus 4",
    logoPath: "/logos/anthropic.svg",
    description: "Claude Opus 4 from May 2025",
  },

  // Google Models
  "models/gemini-2.5-pro": {
    id: "models/gemini-2.5-pro",
    providerId: "google",
    providerName: "Google",
    displayName: "Gemini 2.5 Pro",
    logoPath: "/logos/google.svg",
    description: "Google Gemini 2.5 Pro",
  },
  "models/gemini-2.5-flash": {
    id: "models/gemini-2.5-flash",
    providerId: "google",
    providerName: "Google",
    displayName: "Gemini 2.5 Flash",
    logoPath: "/logos/google.svg",
    description: "Google Gemini 2.5 Flash - Fast responses",
  },
  "models/gemini-2.0-flash": {
    id: "models/gemini-2.0-flash",
    providerId: "google",
    providerName: "Google",
    displayName: "Gemini 2.0 Flash",
    logoPath: "/logos/google.svg",
    description: "Google Gemini 2.0 Flash",
  },
} as const;

// Helper to get models by provider
export function getModelsByProvider(providerId: "openai" | "anthropic" | "google"): AIModel[] {
  return Object.values(AI_MODELS).filter((model) => model.providerId === providerId);
}

// Helper to get provider info
export function getProviderInfo(providerId: "openai" | "anthropic" | "google") {
  return AI_PROVIDERS[providerId];
}

// Type exports
export type ProviderId = keyof typeof AI_PROVIDERS;
export type ModelId = keyof typeof AI_MODELS;
