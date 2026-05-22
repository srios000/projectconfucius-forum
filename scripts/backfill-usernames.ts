import fs from "fs";
import path from "path";

// Load .env.local manually
let envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), ".env");
}

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/\\n/gm, "\n");
      }
      value = value.replace(/(^['"]|['"]$)/g, "").trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function main() {
  const { db } = await import("../lib/db");
  const { authDb } = await import("../lib/db/auth-db");
  const { user: authUser } = await import("../lib/db/auth-schema");
  const { users } = await import("../lib/db/schema");
  const { sql, isNotNull } = await import("drizzle-orm");

  console.log("Starting backfill script...");

  // Stage 1: sync forum.users.username from auth.user.username
  const rows = await authDb
    .select({ id: authUser.id, username: authUser.username })
    .from(authUser)
    .where(isNotNull(authUser.username));
  console.log(`Found ${rows.length} auth users with username; syncing into forum.users…`);
  let syncedUsers = 0;
  for (const row of rows) {
    const result = await db
      .update(users)
      .set({ username: row.username, updatedAt: new Date() })
      .where(sql`${users.authUserId} = ${row.id} AND (${users.username} IS NULL OR ${users.username} <> ${row.username})`);
    syncedUsers += (result as { count?: number }).count ?? 0;
  }
  console.log("Forum users synced:", syncedUsers);

  // Stage 2: backfill posts where creatorUsername is null
  const updatedPosts = await db.execute(sql`
    UPDATE posts
    SET creator_username = users.username
    FROM users
    WHERE posts.creator_id = users.id
      AND posts.creator_username IS NULL
      AND users.username IS NOT NULL;
  `);
  console.log("Posts backfilled:", updatedPosts.count);

  // Stage 3: backfill comments where creatorDisplayText is null
  const updatedComments = await db.execute(sql`
    UPDATE comments
    SET creator_display_text = users.username
    FROM users
    WHERE comments.creator_id = users.id
      AND comments.creator_display_text IS NULL
      AND users.username IS NOT NULL;
  `);
  console.log("Comments backfilled:", updatedComments.count);

  console.log("Backfill complete.");
  process.exit(0);
}


main().catch(console.error);
