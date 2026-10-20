import { Star } from 'lucide-react'
import { formatNumber, formatRating } from 'src/lib/format'
import type { Lead } from 'src/types'

export default function LeadRating({ lead }: { lead: Pick<Lead, 'rating' | 'userRatingCount'> }) {
	if (lead.rating == null) return <span className='text-muted-foreground'>—</span>
	return (
		<span className='inline-flex items-center gap-1 whitespace-nowrap tabular-nums'>
			<Star className='size-3.5 fill-amber-400 text-amber-400' />
			<span className='font-medium'>{formatRating(lead.rating)}</span>
			<span className='text-muted-foreground'>({formatNumber(lead.userRatingCount ?? 0)})</span>
		</span>
	)
}
