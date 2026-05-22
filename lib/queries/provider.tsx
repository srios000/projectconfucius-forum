"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./client";

/**
 * Mounts the TanStack Query client and dev-only devtools.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV !== "production" && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
}