"use client";

import { useAtom, useAtomValue } from "jotai";
import { notificationsAtom, unreadCountAtom } from "@/atoms/notificationsAtom";

// Thin wrapper around the notifications atom. The atom's onMount owns the
// EventSource lifecycle, so this hook contains no side effects of its own.
export default function useNotifications() {
    const [data, setData] = useAtom(notificationsAtom);
    const unreadCount = useAtomValue(unreadCountAtom);
    return { data, setData, unreadCount };
}
