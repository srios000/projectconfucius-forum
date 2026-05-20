import { QueryClient, environmentManager } from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Feeds re-validate on remount after 30s; community detail and search
                // override per-key (see lib/queries/*/use-*.ts in C2).
                staleTime: 30_000,
                // Keep cache 5min after unmount for back-nav warmth.
                gcTime: 5 * 60_000,
                // Forum-style traffic doesn't benefit from focus-refetches.
                refetchOnWindowFocus: false,
                // One retry, then surface the error (hooks turn errors into toasts).
                retry: 1,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
    if (environmentManager.isServer()) {
        // Server: always a fresh client per request, never share across requests.
        return makeQueryClient();
    }
    // Client: lazy-init a single shared instance.
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}