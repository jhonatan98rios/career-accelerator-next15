"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  profileId: string;
  hasInsight: boolean;
}

/**
 * Redirects users who haven't generated an insight yet to the /input page,
 * unless they're already there. Runs once on mount.
 */
export function FirstAccessRedirect({ profileId, hasInsight }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hasInsight && pathname && !pathname.endsWith("/input")) {
      router.replace(`/profile/${profileId}/input`);
    }
  }, [hasInsight, pathname, profileId, router]);

  return null;
}
