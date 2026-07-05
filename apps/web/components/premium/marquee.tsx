import { cn } from "@/lib/utils";

type MarqueeProps = {
  className?: string;
  items: string[];
};

export function Marquee({ className, items }: MarqueeProps) {
  const doubledItems = [...items, ...items];

  return (
    <div
      className={cn(
        "overflow-hidden border-y border-border bg-background/35 py-5",
        className,
      )}
    >
      <div className="marquee-track flex w-max items-center gap-8">
        {doubledItems.map((item, index) => (
          <span
            className="flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
            key={`${item}-${index}`}
          >
            {item}
            <span className="size-1.5 rounded-full bg-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}
