import { describe, it, expect } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { renderWithProviders } from "./renderWithProviders";
import { waitFor } from "@testing-library/react";

function HookProbe({ onData }: { onData: (v: unknown) => void }) {
    const q = useQuery({
        queryKey: ["probe"],
        queryFn: async () => "ok",
    });
    if (q.data) onData(q.data);
    return <span data-testid="probe">{q.data ?? "loading"}</span>;
}

describe("renderWithProviders", () => {
    it("provides a working QueryClient", async () => {
        let captured: unknown = null;
        const { getByTestId } = renderWithProviders(
            <HookProbe onData={(v) => (captured = v)} />,
        );
        await waitFor(() => expect(getByTestId("probe").textContent).toBe("ok"));
        expect(captured).toBe("ok");
    });
});