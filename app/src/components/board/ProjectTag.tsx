import { Badge } from 'src/components/ui/badge'
import { projectColor } from 'src/lib/board'
import { cn } from 'src/lib/utils'

export default function ProjectTag({ leadId, name, className }: { leadId: string; name: string; className?: string }) {
	return (
		<Badge variant='outline' className={cn('max-w-full truncate', projectColor(leadId), className)}>
			{name}
		</Badge>
	)
}
