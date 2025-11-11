"use client";

import { useUIStore } from "@/lib/stores/useUIStore";
import { Sun, Moon, Monitor } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      case "system":
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Toggle theme"
        >
          {getIcon()}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          sideOffset={5}
        >
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-slate-900 outline-none hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            onSelect={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
            {theme === "light" && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-slate-900 outline-none hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            onSelect={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
            {theme === "dark" && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-slate-900 outline-none hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            onSelect={() => setTheme("system")}
          >
            <Monitor className="h-4 w-4" />
            <span>System</span>
            {theme === "system" && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
