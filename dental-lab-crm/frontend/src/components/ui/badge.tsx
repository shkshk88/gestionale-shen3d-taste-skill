import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants
        received: "border-status-received/30 bg-status-received/10 text-status-received",
        "in-progress": "border-status-in-progress/30 bg-status-in-progress/10 text-status-in-progress",
        qc: "border-status-qc/30 bg-status-qc/10 text-status-qc",
        shipped: "border-status-shipped/30 bg-status-shipped/10 text-status-shipped",
        // Priority variants
        normal: "border-priority-normal/30 bg-priority-normal/10 text-priority-normal",
        urgent: "border-priority-urgent/30 bg-priority-urgent/10 text-priority-urgent",
        rush: "border-priority-rush/30 bg-priority-rush/10 text-priority-rush",
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
