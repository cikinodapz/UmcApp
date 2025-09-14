import { Badge } from "@/components/ui/badge"
import { getStatusColor, getStatusText } from "@/lib/format"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={`${getStatusColor(status)} rounded-lg font-medium ${className}`}>{getStatusText(status)}</Badge>
  )
}
