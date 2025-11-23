"use client";

import { ChakraProvider, Toaster } from "@chakra-ui/react";
import { theme } from "@/chakra/theme";
import Layout from "@/components/Layout/Layout";
import { Provider as JotaiProvider } from "jotai";
import { useEffect, useState } from "react";
import { toaster } from "@/hooks/useCustomToast";
import EmotionRegistry from "./emotion-registry";
import { ColorModeProvider } from "@/components/ui/color-mode";

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
            {/* @ts-ignore */}
            {mounted && <Toaster toaster={toaster} />}
          </ColorModeProvider>
        </ChakraProvider>
      </EmotionRegistry>
    </JotaiProvider>
  );
}
