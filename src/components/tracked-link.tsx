"use client";

import Link from "next/link";
import { ComponentProps } from "react";
import { trackNavClick, NavCategory } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  navCategory: NavCategory;
  navLabel: string;
};

export function TrackedLink({ navCategory, navLabel, href, onClick, ...props }: Props) {
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        trackNavClick({
          category: navCategory,
          action: "click",
          label: navLabel,
        });
        onClick?.(e);
      }}
    />
  );
}
