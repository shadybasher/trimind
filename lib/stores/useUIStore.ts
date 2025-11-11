import { create } from "zustand";

// Model states for multi-model conversation
type ModelState = "active" | "silent" | "observe";

interface ModelStates {
  gpt: ModelState;
  gemini: ModelState;
  claude: ModelState;
  [key: string]: ModelState;
}

// UI-only state (no server state here)
interface UIState {
  // Active pane in the conversation view
  activePane: "chat" | "history" | "settings" | null;

  // Sidebar visibility
  isSidebarOpen: boolean;

  // Model states for multi-model conversation
  modelStates: ModelStates;

  // Theme (if not using system preference)
  theme: "light" | "dark" | "system";

  // Actions
  setActivePane: (pane: "chat" | "history" | "settings" | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setModelState: (model: string, state: ModelState) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  resetUIState: () => void;
}

// Initial state
const initialState = {
  activePane: "chat" as const,
  isSidebarOpen: true,
  modelStates: {
    gpt: "active" as ModelState,
    gemini: "active" as ModelState,
    claude: "active" as ModelState,
  },
  theme: "system" as const,
};

// Zustand store for UI state only
export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  setActivePane: (pane) =>
    set(() => ({
      activePane: pane,
    })),

  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),

  setSidebarOpen: (open) =>
    set(() => ({
      isSidebarOpen: open,
    })),

  setModelState: (model, state) =>
    set((prev) => ({
      modelStates: {
        ...prev.modelStates,
        [model]: state,
      },
    })),

  setTheme: (theme) =>
    set(() => ({
      theme,
    })),

  resetUIState: () =>
    set(() => ({
      ...initialState,
    })),
}));
