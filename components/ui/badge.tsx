import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variant === "default"
          ? "bg-[#1f6feb]/20 text-[#58a6ff]"
          : "border border-[#30363d] text-[#8b949e]",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
