"use client";

import { useSession } from "@/lib/auth-client";

// Where the "stop impersonating" control actually lives. Siblings don't end
// impersonation themselves (the admin plugin's stopImpersonating rotates the
// cookie on the hub); we send the admin back to the hub, which renders its own
// banner with the stop button app-wide. See docs/sibling-app-integration.md §5.
const HUB_URL = "https://login.projectconfucius.id";

/**
 * Read-only indicator shown app-wide whenever the current session is a hub
 * impersonation session (`session.session.impersonatedBy` is set). The forum
 * only reflects the state; the 1h timebox and teardown are owned by the hub.
 */
export default function ImpersonationBanner() {
  const { data } = useSession();
  // `impersonatedBy` is a server-side session additionalField (see lib/auth.ts);
  // it isn't in the client's inferred Session type, so read it defensively.
  const session = data?.session as { impersonatedBy?: string | null } | undefined;
  if (!session?.impersonatedBy) return null;

  const who = data?.user?.name ?? data?.user?.email ?? "another user";

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-4 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      <span>
        You are viewing the forum as <strong>{who}</strong> (impersonated session).
      </span>
      <a href={HUB_URL} className="shrink-0 font-medium underline">
        Return to admin console
      </a>
    </div>
  );
}
