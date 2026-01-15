import { Badge } from '@/components/ui/badge'
import type { RequestResponse } from '@/lib/request.schemas'

interface StatusBadgeProps {
  status: RequestResponse['status']
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    PENDING: {
      variant: 'secondary' as const,
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    APPROVED: {
      variant: 'default' as const,
      label: 'Approved',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    REJECTED: {
      variant: 'destructive' as const,
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
