"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/components/theme/theme-provider";

/** Sonner toaster that follows the app theme (light paper / dark glass). */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Toaster
      theme={resolvedTheme}
      position="top-center"
      toastOptions={{
        style: dark
          ? { background: "#182035", border: "1px solid #222c46", color: "#e9edf7" }
          : { background: "#ffffff", border: "1px solid #ded8ea", color: "#1e1b2e" },
      }}
    />
  );
}
