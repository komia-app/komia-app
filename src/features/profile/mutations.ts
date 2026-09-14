import { useMutation } from "@tanstack/react-query";

import { useSession } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";

export interface ProfileUpdate {
  home_city: string;
  favorite_cuisines: string[];
}

export function useUpdateProfile() {
  const { refreshUser } = useSession();
  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      await base44.auth.updateMe(update);
      await refreshUser();
    },
  });
}
