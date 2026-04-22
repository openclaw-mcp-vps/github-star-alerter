import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-[#c9d1d9]", className)} {...props} />;
}

export { Label };
