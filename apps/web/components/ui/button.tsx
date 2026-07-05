import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary px-4 py-2.5 text-primary-foreground shadow-action hover:bg-primary/90",
        primary:
          "border border-primary bg-primary px-4 py-2.5 text-primary-foreground shadow-action hover:bg-primary/90",
        secondary:
          "border border-border bg-secondary px-4 py-2.5 text-secondary-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-input bg-background px-4 py-2.5 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost:
          "px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        signal:
          "border border-warning bg-warning px-4 py-2.5 text-warning-foreground shadow-raised hover:bg-warning/90",
        destructive:
          "border border-destructive bg-destructive px-4 py-2.5 text-destructive-foreground shadow-action hover:bg-destructive/90",
        link: "min-h-0 px-0 py-0 text-primary underline-offset-4 hover:underline motion-safe:hover:translate-y-0",
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
