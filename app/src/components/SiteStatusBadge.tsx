import { siteStatusOption } from 'src/constants/labels'
import type { SiteStatus } from 'src/types'

export default function SiteStatusBadge({ status }: { status: SiteStatus }) {
	const option = siteStatusOption(status)
	return (
		<span className={`inline-block rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${option.className}`}>
			{option.label}
		</span>
	)
}
