"use client";
import { SessionUser } from "@/types/sessionUser";
import AuthButtons from "./AuthButtons";
import UserMenu from "./user-menu/UserMenu";
import NotificationsBell from "./NotificationsBell";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function RightContent({
  user,
  loading,
}: { user: SessionUser | null; loading?: boolean; }) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ThemeToggle />
      {!loading && user && <NotificationsBell />}
      {loading ? null : user ? <UserMenu user={user} /> : <AuthButtons />}
    </div>
  );
}
