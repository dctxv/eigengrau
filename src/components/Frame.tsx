import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type FrameProps<T extends ElementType> = {
  as?: T;
  /** Outer layer: sizing, position, layout. */
  className?: string;
  /** Inner layer: background, padding. Defaults to surface-1. */
  innerClassName?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * A surface with a 1px line and one clipped top-right corner.
 * Two layers so the line follows the diagonal. No border radius.
 */
export function Frame<T extends ElementType = "div">({
  as,
  className,
  innerClassName,
  children,
  ...rest
}: FrameProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={cn("clip-corner bg-line p-px", className)} {...rest}>
      <div className={cn("clip-corner-inner h-full w-full bg-surface-1", innerClassName)}>
        {children}
      </div>
    </Tag>
  );
}
