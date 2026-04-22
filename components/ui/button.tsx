import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[#2ea043] text-[#f0f6fc] hover:bg-[#3fb950] focus-visible:outline-[#3fb950] disabled:bg-[#1f6f36]",
  secondary:
    "bg-[#1f6feb] text-[#f0f6fc] hover:bg-[#388bfd] focus-visible:outline-[#388bfd] disabled:bg-[#1d4f8e]",
  outline:
    "border border-[#30363d] bg-transparent text-[#c9d1d9] hover:bg-[#161b22] focus-visible:outline-[#58a6ff]",
  ghost: "bg-transparent text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] focus-visible:outline-[#58a6ff]"
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-6 text-base"
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
