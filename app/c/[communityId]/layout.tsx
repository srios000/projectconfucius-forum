import { ReactNode } from "react";

// Parallel-route slot @modal will be added in Phase 5 alongside `children`.
export default function CommunityLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal?: ReactNode;
}) {
  return <>{children}{modal}</>;
}
