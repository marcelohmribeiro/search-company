import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'src/lib/utils'

export default function PitchMarkdown({ children, className }: { children: string; className?: string }) {
	return (
		<div
			className={cn(
				'space-y-3 text-sm leading-relaxed break-words',
				'[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline',
				'[&_h1]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium',
				'[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
				'[&_strong]:font-semibold [&_em]:text-muted-foreground',
				'[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
				'[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
				'[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:bg-muted/50 [&_th]:p-2 [&_th]:text-left [&_th]:font-medium',
				className,
			)}
		>
			<Markdown
				remarkPlugins={[remarkGfm]}
				components={{
					a: ({ node: _node, ...props }) => <a {...props} target='_blank' rel='noreferrer' />,
					table: ({ node: _node, ...props }) => (
						<div className='overflow-x-auto'>
							<table {...props} />
						</div>
					),
				}}
			>
				{children}
			</Markdown>
		</div>
	)
}
