"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfileAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useUserProfileQuery({ idOrUsername }: { idOrUsername: string }) {
  return useQuery({
    queryKey: keys.profile(idOrUsername),
    queryFn: () => getUserProfileAction(idOrUsername),
    enabled: !!idOrUsername,
    staleTime: 60_000,
  });
}
