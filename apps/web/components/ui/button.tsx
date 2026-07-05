import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 ease-premium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          "border border-accent bg-accent px-4 py-2.5 text-accent-foreground shadow-action hover:border-accent-darker hover:bg-accent-darker",
        primary:
          "border border-accent bg-accent px-4 py-2.5 text-accent-foreground shadow-action hover:border-accent-darker hover:bg-accent-darker",
        secondary:
          "border border-hairline bg-surface px-4 py-2.5 text-ink-display shadow-sm hover:bg-accent-faded hover:text-ink-display",
        outline:
          "border border-hairline bg-page px-4 py-2.5 text-ink-display shadow-sm hover:border-border-accent hover:bg-surface",
        ghost:
          "px-3 py-2 text-ink-muted hover:bg-surface hover:text-ink-display",
        signal:
          "border border-signal bg-signal px-4 py-2.5 text-signal-darker shadow-raised hover:bg-signal-faded",
        success:
          "border border-state-success bg-state-success px-4 py-2.5 text-success-foreground shadow-raised hover:bg-state-success/90",
        destructive:
          "border border-state-danger bg-state-danger px-4 py-2.5 text-destructive-foreground shadow-action hover:bg-state-danger/90",
        link: "min-h-0 px-0 py-0 text-accent underline-offset-4 hover:underline motion-safe:hover:translate-y-0",
      },
      size: {
        sm: "min-h-9 px-3 text-xs",
        md: "min-h-10",
        lg: "min-h-12 px-5 text-base",
        icon: "size-10 min-h-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      isLoading = false,
      variant,
      size,
      ...props
    },
    ref,
  ) => (
    <button
      aria-busy={isLoading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : null}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export { buttonVariants };
