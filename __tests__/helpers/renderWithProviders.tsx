import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";

function makeTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
                refetchOnWindowFocus: false,
            },
            mutations: { retry: false },
        },
    });
}

type Options = Omit<RenderOptions, "wrapper"> & {
    queryClient?: QueryClient;
};

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
    const { queryClient = makeTestQueryClient(), ...rest } = options;
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <JotaiProvider>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </JotaiProvider>
        );
    }
    return { ...render(ui, { wrapper: Wrapper, ...rest }), queryClient };
}