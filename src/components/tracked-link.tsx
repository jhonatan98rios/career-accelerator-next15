"use client";

import Link from "next/link";
import { ComponentProps } from "react";
import { trackNavClick, NavType } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  navType: NavType;
  navLabel: string;
};

export function TrackedLink({ navType, navLabel, href, onClick, ...props }: Props) {
  const hrefStr = typeof href === "string" ? href : (href as { pathname?: string }).pathname ?? "";
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        trackNavClick({
          nav_type: navType,
          nav_label: navLabel,
          nav_url: hrefStr,
          page_location: window.location.pathname,
        });
        onClick?.(e);
      }}
    />
  );
}
