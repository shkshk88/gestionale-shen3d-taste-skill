import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand text-white hover:bg-brand/90",
        secondary:
          "border-transparent bg-stone-100 text-stone-800 hover:bg-stone-100/80",
        destructive:
          "border-transparent bg-red-500/90 text-white hover:bg-red-500/80",
        outline: "text-stone-800 border-stone-200",
        // Status variants — muted, warm
        received: "border-stone-300/50 bg-stone-50 text-stone-700",
        "in-progress": "border-amber-300/50 bg-amber-50/80 text-amber-800",
        qc: "border-stone-300/50 bg-stone-50 text-stone-700",
        shipped: "border-green-300/50 bg-green-50/80 text-green-800",
        // Priority variants — muted
        normal: "border-green-300/50 bg-green-50/80 text-green-800",
        urgent: "border-amber-300/50 bg-amber-50/80 text-amber-800",
        rush: "border-red-300/50 bg-red-50/80 text-red-800",
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
