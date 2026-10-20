import PageHeader from 'src/components/PageHeader'
import SearchForm from 'src/components/search/SearchForm'
import SearchHistoryCard from 'src/components/search/SearchHistoryCard'
import SearchProgressCard from 'src/components/search/SearchProgressCard'
import { useApi, useSearchRunner } from 'src/hooks'
import { fetchSearches } from 'src/services'

export default function Index() {
	const history = useApi(fetchSearches)
	const runner = useSearchRunner(history.reload)

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Buscar empresas'
				description='Encontre empresas no Google Maps por categoria e bairro. Elas entram na lista de leads.'
			/>

			<div className='grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]'>
				<SearchForm running={runner.running} stopping={runner.stopping} onRun={runner.run} onStop={runner.stop} />

				<div className='min-w-0 space-y-6'>
					{runner.progress.length > 0 && (
						<SearchProgressCard city={runner.city} items={runner.progress} running={runner.running} />
					)}
					<SearchHistoryCard
						searches={history.data ?? []}
						loading={history.loading && !history.data}
						error={history.error}
					/>
				</div>
			</div>
		</div>
	)
}
