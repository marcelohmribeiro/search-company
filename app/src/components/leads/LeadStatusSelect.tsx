import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { LEAD_STATUS_OPTIONS } from 'src/constants/labels'
import { cn } from 'src/lib/utils'
import type { LeadStatus } from 'src/types'

interface LeadStatusSelectProps {
	value: LeadStatus
	onChange: (status: LeadStatus) => void
	id?: string
	size?: 'sm' | 'default'
	className?: string
}

export default function LeadStatusSelect({ value, onChange, id, size = 'default', className }: LeadStatusSelectProps) {
	return (
		<Select value={value} onValueChange={(next) => onChange(next as LeadStatus)}>
			<SelectTrigger id={id} size={size} className={className}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{LEAD_STATUS_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						<span className={cn('size-2 shrink-0 rounded-full', option.dotClassName)} />
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
