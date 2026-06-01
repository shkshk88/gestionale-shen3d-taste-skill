import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-sky-600 text-white hover:bg-sky-600/90",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-100/80",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-500/90",
        outline: "text-slate-800 border-slate-200",
        // Status variants
        received: "border-sky-500/30 bg-sky-50 text-sky-700",
        "in-progress": "border-amber-500/30 bg-amber-50 text-amber-700",
        qc: "border-violet-500/30 bg-violet-50 text-violet-700",
        shipped: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
        // Priority variants
        normal: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
        urgent: "border-amber-500/30 bg-amber-50 text-amber-700",
        rush: "border-red-500/30 bg-red-50 text-red-700",
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
