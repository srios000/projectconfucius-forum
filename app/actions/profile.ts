"use server";

import { headers as nextHeaders } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteProfileImage } from "@/lib/user-profile/deleteProfileImage";
import { patchAuthUserImage } from "@/lib/auth/patchAuthUserImage";

export async function profileNameAction(name: string) {
  const { userId } = await requireUser();
  const trimmed = name.trim();
  await db
    .update(users)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { userId };
}

export async function getMeAction() {
  const { user } = await requireUser();
  return { id: user.id, username: user.username ?? null };
}

export async function removeProfileImageAction() {
  const { userId } = await requireUser();
  const result = await deleteProfileImage(userId);
  await patchAuthUserImage(await nextHeaders(), null);
  return result;
}
