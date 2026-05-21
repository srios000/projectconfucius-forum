export function formatUserHandle(username: string | null | undefined): string {
    return `u/${username ?? "deleted"}`;
}