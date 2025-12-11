"use client";

import { ThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import * as React from "react";

/**
 * Wraps the app with `next-themes` so Chakra `_dark` tokens respond to system mode.
 * @param props - Theme provider props forwarded to `ThemeProvider`.
 * @returns ThemeProvider with class-based toggling.
 */
export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  );
}

/**
 * Provides helpers to read and toggle color mode using `next-themes`.
 * @returns Current mode plus setters for light/dark.
 */
export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };
  return {
    colorMode: resolvedTheme,
    setColorMode: setTheme,
    toggleColorMode,
  };
}

/**
 * Mirrors Chakra's `useColorModeValue` for components outside Chakra's context.
 * @param light - Value returned when in light mode.
 * @param dark - Value returned when in dark mode.
 * @returns Value matching the active theme.
 */
export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}
