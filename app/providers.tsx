"use client";

import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { Toaster as ChakraToaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/queries/provider";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as JotaiProvider } from "jotai";
import { Toaster as SonnerToaster } from "sonner";
import { useEffect, useState } from "react";
import EmotionRegistry from "./emotion-registry";

/**
 * The root provider component that initializes the application's global context.
 * Orchestrates state management (Jotai), styling (Emotion, Chakra UI), theming (ColorMode), and the global layout shell.
 * @param children - The application content to be wrapped by the providers.
 * @returns A nested provider tree ensuring all global services are available.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <JotaiProvider>
      <QueryProvider>
        <EmotionRegistry>
          <ChakraProvider value={theme}>
            <ColorModeProvider>
              <Layout>{children}</Layout>
            </ColorModeProvider>
            {mounted && <ChakraToaster />}
            <SonnerToaster richColors closeButton position="bottom-right" theme="system" />
          </ChakraProvider>
        </EmotionRegistry>
      </QueryProvider>
    </JotaiProvider>
  );
}