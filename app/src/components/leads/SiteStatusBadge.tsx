import { Badge } from 'src/components/ui/badge'
import { siteStatusOption } from 'src/constants/labels'
import { cn } from 'src/lib/utils'
import type { SiteStatus } from 'src/types'

export default function SiteStatusBadge({ status, className }: { status: SiteStatus; className?: string }) {
	const option = siteStatusOption(status)
	return (
		<Badge variant='outline' className={cn(option.className, className)}>
			{option.label}
		</Badge>
	)
}
