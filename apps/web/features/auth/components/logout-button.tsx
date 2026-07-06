import { LogOut } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";

export function LogoutButton({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "chip";
}) {
  if (variant === "chip") {
    return (
      <form action={logoutAction} className="shrink-0">
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink-muted shadow-sm transition duration-200 ease-premium hover:bg-accent-faded hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
          type="submit"
        >
          <LogOut aria-hidden className="size-4" />
          Logout
        </button>
      </form>
    );
  }

  return (
    <form action={logoutAction}>
      <button
        className="group grid w-full grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition duration-200 ease-premium hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
        type="submit"
      >
        <span className="grid size-7 place-items-center rounded-lg border border-hairline bg-page text-accent transition duration-200 ease-premium group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground motion-reduce:transition-none">
          <LogOut aria-hidden className="size-4" />
        </span>
        <span className="font-ui text-sm font-semibold text-ink-display">
          Logout
        </span>
      </button>
    </form>
  );
}
