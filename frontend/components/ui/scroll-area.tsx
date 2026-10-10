"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

type ScrollAreaProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  viewportClassName?: string
  scrollbarOrientation?: "vertical" | "horizontal" | "both"
  scrollbarClassName?: string
  scrollbarThumbClassName?: string
  scrollbarForceMount?: boolean
}

function ScrollArea({
  className,
  children,
  viewportClassName,
  scrollbarOrientation = "vertical",
  scrollbarClassName,
  scrollbarThumbClassName,
  scrollbarForceMount,
  ...props
}: ScrollAreaProps) {
  const showVertical =
    scrollbarOrientation === "vertical" || scrollbarOrientation === "both"
  const showHorizontal =
    scrollbarOrientation === "horizontal" || scrollbarOrientation === "both"

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
          viewportClassName
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {showVertical ? (
        <ScrollBar
          className={scrollbarClassName}
          thumbClassName={scrollbarThumbClassName}
          forceMount={scrollbarForceMount ? true : undefined}
        />
      ) : null}
      {showHorizontal ? (
        <ScrollBar
          orientation="horizontal"
          className={scrollbarClassName}
          thumbClassName={scrollbarThumbClassName}
          forceMount={scrollbarForceMount ? true : undefined}
        />
      ) : null}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

type ScrollBarProps = React.ComponentProps<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
> & {
  thumbClassName?: string
}

function ScrollBar({
  className,
  orientation = "vertical",
  thumbClassName,
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none overflow-hidden",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn("bg-border relative flex-1 rounded-full", thumbClassName)}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
