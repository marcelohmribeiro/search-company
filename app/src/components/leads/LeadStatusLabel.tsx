import { leadStatusOption } from 'src/constants/labels'
import { cn } from 'src/lib/utils'
import type { LeadStatus } from 'src/types'

export default function LeadStatusLabel({ status }: { status: LeadStatus }) {
	const option = leadStatusOption(status)
	return (
		<span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
			<span className={cn('size-2 shrink-0 rounded-full', option.dotClassName)} />
			{option.label}
		</span>
	)
}
