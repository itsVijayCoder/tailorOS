import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

type ImageRevealProps = ImageProps & {
  wrapperClassName?: string;
};

export function ImageReveal({
  alt,
  className,
  wrapperClassName,
  ...props
}: ImageRevealProps) {
  return (
    <div
      className={cn(
        "image-reveal relative overflow-hidden rounded-[1.5rem] bg-card",
        wrapperClassName,
      )}
    >
      <Image
        alt={alt}
        className={cn("size-full object-cover", className)}
        {...props}
      />
    </div>
  );
}
