export async function patchAuthUserImage(
    reqHeaders: Headers,
    image: string | null,
): Promise<void> {
    const cookie = reqHeaders.get("cookie") ?? "";
    const base = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    if (!base) {
        console.error("[patchAuthUserImage] NEXT_PUBLIC_BETTER_AUTH_URL not set");
        return;
    }
    const url = `${base}/api/user/image`;
    try {
        const res = await fetch(url, {
            method: "PATCH",
            headers: { cookie, "content-type": "application/json" },
            body: JSON.stringify({ image }),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error("[patchAuthUserImage] non-2xx", res.status, body);
        }
    } catch (err) {
        console.error("[patchAuthUserImage] fetch failed", err);
    }
}