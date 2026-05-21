"use client";

import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
import { Toaster as ChakraToaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/queries/provider";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import { useEffect, useState } from "react";
import EmotionRegistry from "./emotion-registry";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <JotaiProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <EmotionRegistry>
            <ChakraProvider value={theme}>
              <Layout>{children}</Layout>
              {mounted && <ChakraToaster />}
            </ChakraProvider>
          </EmotionRegistry>
          <SonnerToaster richColors closeButton position="bottom-right" theme="system" />
        </ThemeProvider>
      </QueryProvider>
    </JotaiProvider>
  );
}