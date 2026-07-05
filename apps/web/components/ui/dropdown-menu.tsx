"use client";

import * as React from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

const DropdownMenu = BaseMenu.Root;
const DropdownMenuTrigger = BaseMenu.Trigger;
const DropdownMenuPortal = BaseMenu.Portal;
const DropdownMenuPositioner = BaseMenu.Positioner;
const DropdownMenuSeparator = BaseMenu.Separator;

const DropdownMenuPopup = React.forwardRef<
  React.ElementRef<typeof BaseMenu.Popup>,
  React.ComponentPropsWithoutRef<typeof BaseMenu.Popup>
>(({ className, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPositioner sideOffset={8}>
      <BaseMenu.Popup
        className={cn(
          "z-50 min-w-52 rounded-xl border border-hairline bg-surface-strong p-1.5 text-ink-body shadow-lift transition duration-150 ease-premium data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 motion-reduce:transition-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    </DropdownMenuPositioner>
  </DropdownMenuPortal>
));

DropdownMenuPopup.displayName = "DropdownMenuPopup";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof BaseMenu.Item>,
  React.ComponentPropsWithoutRef<typeof BaseMenu.Item>
>(({ className, ...props }, ref) => (
  <BaseMenu.Item
    className={cn(
      "flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-body outline-none transition duration-150 ease-premium data-[highlighted]:bg-accent-faded data-[highlighted]:text-ink-display data-[disabled]:pointer-events-none data-[disabled]:opacity-50 motion-reduce:transition-none",
      className,
    )}
    ref={ref}
    {...props}
  />
));

DropdownMenuItem.displayName = "DropdownMenuItem";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
