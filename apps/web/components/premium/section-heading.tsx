import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  centered?: boolean;
  className?: string;
  description?: string;
  eyebrow?: string;
  italicTitleWord?: string;
  title: string;
};

export function SectionHeading({
  centered,
  className,
  description,
  eyebrow,
  italicTitleWord,
  title,
}: SectionHeadingProps) {
  const titleParts =
    italicTitleWord && title.includes(italicTitleWord)
      ? title.split(italicTitleWord)
      : null;

  return (
    <div
      className={cn(
        "flex max-w-4xl flex-col gap-5",
        centered && "mx-auto items-center text-center",
        className,
      )}
      data-reveal
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-balance font-display text-5xl font-light leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-7xl">
        {titleParts ? (
          <>
            {titleParts[0]}
            <span className="font-display font-light italic text-primary">
              {italicTitleWord}
            </span>
            {titleParts.slice(1).join(italicTitleWord)}
          </>
        ) : (
          title
        )}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-3xl text-base leading-[1.65] text-muted-foreground md:text-lg",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
