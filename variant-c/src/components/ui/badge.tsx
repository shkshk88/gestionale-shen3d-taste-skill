import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        secondary:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-100/80",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "text-gray-800 border-gray-200",
        // Status variants
        received: "border-blue-200 bg-blue-50 text-blue-700",
        "in-progress": "border-amber-200 bg-amber-50 text-amber-700",
        qc: "border-violet-200 bg-violet-50 text-violet-700",
        shipped: "border-emerald-200 bg-emerald-50 text-emerald-700",
        // Priority variants
        normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
        urgent: "border-amber-200 bg-amber-50 text-amber-700",
        rush: "border-red-200 bg-red-50 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
