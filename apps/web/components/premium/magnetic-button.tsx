import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

export function MagneticButton({
  children,
  className,
  strength = 12,
}: MagneticButtonProps) {
  return (
    <span className={cn("inline-flex", className)} data-magnetic={strength}>
      <span data-magnetic-content>{children}</span>
    </span>
  );
}
