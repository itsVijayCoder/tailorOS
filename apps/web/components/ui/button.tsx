import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        primary:
          "border border-accent bg-accent px-4 py-2.5 text-white shadow-[0_16px_34px_rgba(8,145,178,0.22)] hover:border-accent-darker hover:bg-accent-darker",
        secondary:
          "border border-hairline bg-page/80 px-4 py-2.5 text-ink-display shadow-sm hover:border-accent/40 hover:bg-accent-faded hover:text-accent-darker",
        ghost:
          "px-3 py-2 text-ink-muted hover:bg-surface hover:text-ink-display",
        signal:
          "border border-signal bg-signal px-4 py-2.5 text-ink-display shadow-[0_16px_34px_rgba(252,211,77,0.18)] hover:bg-signal-darker hover:text-white",
      },
      size: {
        sm: "min-h-9 px-3 text-xs",
        md: "min-h-10",
        lg: "min-h-12 px-5 text-base",
        icon: "size-10 min-h-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { buttonVariants };
