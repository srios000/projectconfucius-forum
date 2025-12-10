"use client";

import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as JotaiProvider } from "jotai";
import { useEffect, useState } from "react";
import EmotionRegistry from "./emotion-registry";

/**
 * Wraps the app with global providers for state, styling, theming, and layout shell.
 * @param children - Next.js page content to render inside the provider tree.
 * @returns Provider hierarchy with a mounted flag to avoid hydration issues for the toaster.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <JotaiProvider>
      <EmotionRegistry>
        <ChakraProvider value={theme}>
          <ColorModeProvider>
            <Layout>{children}</Layout>
          </ColorModeProvider>
          {mounted && <Toaster />}
        </ChakraProvider>
      </EmotionRegistry>
    </JotaiProvider>
  );
}
