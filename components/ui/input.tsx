import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#c9d1d9] placeholder:text-[#6e7681] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#58a6ff]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
