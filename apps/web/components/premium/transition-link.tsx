"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

import { useTransitionStore } from "@/store/transition-store";

type TransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    children: ReactNode;
    href: string;
  };

function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TransitionLink({
  children,
  href,
  onClick,
  target,
  ...props
}: TransitionLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { beginTransition, isTransitioning, markNavigating } =
    useTransitionStore();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0 ||
      target ||
      href.startsWith("#") ||
      isExternalHref(href)
    ) {
      return;
    }

    const targetPath = href.split("#")[0] || "/";

    if (targetPath === pathname || isTransitioning) {
      event.preventDefault();
      return;
    }

    if (prefersReducedMotion()) {
      event.preventDefault();
      router.push(href);
      return;
    }

    event.preventDefault();
    beginTransition(href);

    window.setTimeout(() => {
      markNavigating();
      router.push(href);
    }, 560);
  };

  return (
    <Link href={href} onClick={handleClick} target={target} {...props}>
      {children}
    </Link>
  );
}
