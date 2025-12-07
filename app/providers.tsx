"use client";

import { ChakraProvider, Toaster } from "@chakra-ui/react";
import { theme } from "@/chakra/theme";
import Layout from "@/components/layout/Layout";
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
          </ColorModeProvider>
          {mounted && (
            // @ts-ignore
            <Toaster toaster={toaster}>
              {(toast: any) => {
                const type = toast.type || "info";
                const colors: any = {
                  success: "green",
                  error: "red",
                  warning: "orange",
                  info: "blue",
                };
                const colorScheme = colors[type];

                return (
                  <div
                    style={{
                      background: `var(--chakra-colors-${colorScheme}-500)`,
                      color: "white",
                      padding: "12px 16px",
                      borderRadius: "6px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      marginBottom: "8px",
                      display: "flex",
                      flexDirection: "column",
                      minWidth: "300px",
                    }}
                  >
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {toast.title}
                    </div>
                    {toast.description && (
                      <div style={{ fontSize: "0.9em" }}>
                        {toast.description}
                      </div>
                    )}
                  </div>
                );
              }}
            </Toaster>
          )}
        </ChakraProvider>
      </EmotionRegistry>
    </JotaiProvider>
  );
}
