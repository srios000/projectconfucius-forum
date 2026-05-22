import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export type UserProfile = {
  id: string;
  name: string;
  username: string | null;
  imageUrl: string | null;
};

export const getUserProfile = async (idOrUsername: string): Promise<UserProfile | null> => {
  const row = await db.query.users.findFirst({
    where: or(eq(users.id, idOrUsername), eq(users.username, idOrUsername)),
  });
  if (!row) return null;
  return { id: row.id, name: row.name, username: row.username, imageUrl: row.imageUrl };
};
