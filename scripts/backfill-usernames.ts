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
  const { sql } = await import("drizzle-orm");

  console.log("Starting backfill script...");

  // Update posts where creatorUsername is null
  const updatedPosts = await db.execute(sql`
    UPDATE posts
    SET creator_username = users.username
    FROM users
    WHERE posts.creator_id = users.id
      AND posts.creator_username IS NULL
      AND users.username IS NOT NULL;
  `);
  console.log("Posts backfilled:", updatedPosts.count);

  // Update comments where creatorDisplayText is null
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
