import { ArrowRight } from "lucide-react";
import type { MouseEventHandler, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/premium/transition-link";

const premiumButtonVariants = cva(
  "group/button relative inline-flex items-center justify-center overflow-hidden rounded-full font-ui text-sm font-semibold transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-0.5",
  {
    variants: {
      size: {
        md: "h-12 px-6",
        lg: "h-14 px-8 text-base",
      },
      variant: {
        primary:
          "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
        secondary:
          "border border-border bg-transparent text-foreground hover:border-border-accent hover:bg-secondary/45",
        ghost:
          "border border-transparent bg-transparent text-muted-foreground hover:bg-secondary/35 hover:text-foreground",
        dark: "border border-border bg-card text-card-foreground hover:border-border-accent hover:bg-card/85",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
  },
);

type PremiumButtonProps = VariantProps<typeof premiumButtonVariants> & {
  children: ReactNode;
  className?: string;
  href?: string;
  icon?: ReactNode;
  magnetic?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  rel?: string;
  target?: string;
  type?: "button" | "reset" | "submit";
};

export function PremiumButton({
  children,
  className,
  href,
  icon,
  magnetic = true,
  onClick,
  rel,
  size,
  target,
  type = "button",
  variant,
}: PremiumButtonProps) {
  const content = (
    <>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-60 transition duration-700 group-hover/button:translate-x-full" />
      <span
        className="relative z-10 flex items-center gap-2"
        data-magnetic-content
      >
        {children}
        <span className="transition-transform duration-300 group-hover/button:translate-x-1">
          {icon ?? <ArrowRight aria-hidden className="size-4" />}
        </span>
      </span>
    </>
  );

  const classNames = cn(premiumButtonVariants({ size, variant }), className);
  const magneticProps = magnetic ? { "data-magnetic": "12" } : undefined;

  if (href) {
    const isRoute = href.startsWith("/");

    if (isRoute) {
      return (
        <TransitionLink
          className={classNames}
          href={href}
          onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
          rel={rel}
          target={target}
          {...magneticProps}
        >
          {content}
        </TransitionLink>
      );
    }

    return (
      <a
        className={classNames}
        href={href}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
        rel={rel}
        target={target}
        {...magneticProps}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={classNames}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
      type={type}
      {...magneticProps}
    >
      {content}
    </button>
  );
}
