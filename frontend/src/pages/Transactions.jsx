import { useMemo, useState } from 'react'
import { useAppState } from '../context/AppStateContext'

const PAGE_SIZE = 6

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatTransactionDate = (dateValue) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(dateValue))

const Transactions = () => {
  const {
    filteredTransactions,
    filters,
    income,
    resetTransactionFilters,
    transactionCategories,
    updateFilter,
  } = useAppState()
  const [currentPage, setCurrentPage] = useState(1)

  const { clampedPage, paginatedTransactions, totalPages } = useMemo(() => {
    const pages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
    const page = Math.min(currentPage, pages)
    const startIndex = (page - 1) * PAGE_SIZE
    return {
      clampedPage: page,
      paginatedTransactions: filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE),
      totalPages: pages,
    }
  }, [currentPage, filteredTransactions])

  return (
    <section className="grid gap-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="m-0 text-[1.2rem]">All Transactions</h2>
          <p className="m-[0.25rem_0_0] text-[0.84rem] text-[var(--text-muted)]">
            Transactions state is shared across the application
          </p>
        </div>
        <a
          className="rounded-[10px] border border-[var(--border)] px-[0.65rem] py-[0.4rem] text-[0.8rem] font-semibold text-[var(--text-main)] no-underline transition hover:bg-[var(--surface-soft)]"
          href="#/dashboard"
        >
          Back to Dashboard
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="filter-type">
          Filter by type
        </label>
        <select
          className="h-[38px] min-w-[130px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-[0.55rem] text-[0.84rem] text-[var(--text-main)]"
          id="filter-type"
          onChange={(event) => {
            updateFilter('transactionType', event.target.value)
            setCurrentPage(1)
          }}
          value={filters.transactionType}
        >
          <option value="all">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>

        <label className="sr-only" htmlFor="filter-category">
          Filter by category
        </label>
        <select
          className="h-[38px] min-w-[130px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-[0.55rem] text-[0.84rem] text-[var(--text-main)]"
          id="filter-category"
          onChange={(event) => {
            updateFilter('transactionCategory', event.target.value)
            setCurrentPage(1)
          }}
          value={filters.transactionCategory}
        >
          {transactionCategories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-search">
          Search by transaction id or sender/receiver
        </label>
        <input
          className="h-[38px] min-w-[240px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-[0.65rem] text-[0.84rem] text-[var(--text-main)] max-sm:w-full max-sm:min-w-0"
          id="filter-search"
          onChange={(event) => {
            updateFilter('transactionSearch', event.target.value)
            setCurrentPage(1)
          }}
          placeholder="Search by ID or name"
          type="text"
          value={filters.transactionSearch}
        />

        <button
          className="cursor-pointer rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[0.84rem] font-semibold text-[var(--text-main)]"
          onClick={() => {
            resetTransactionFilters()
            setCurrentPage(1)
          }}
          type="button"
        >
          Reset Filters
        </button>
      </div>

      <article className="overflow-x-auto rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 pb-5 shadow-[var(--shadow)]">
        <div className="grid grid-cols-[1.1fr_1.15fr_1.9fr_1.2fr_0.8fr_1fr] gap-3 border-b border-[var(--border)] pb-[0.7rem] text-[0.78rem] font-bold uppercase text-[var(--text-muted)]">
          <span>Date</span>
          <span>Transaction ID</span>
          <span>Sender/Receiver</span>
          <span>Category</span>
          <span>Type</span>
          <span className="text-right">Amount</span>
        </div>

        <div className="grid">
          {paginatedTransactions.length === 0 ? (
            <p className="m-[0.5rem_0_0] text-[var(--text-muted)]">No transactions match the selected filters.</p>
          ) : (
            paginatedTransactions.map((transaction) => {
              const isCredit = transaction.transactionType.toLowerCase() === 'credit'
              const signedAmount = isCredit ? transaction.amount : -transaction.amount

              return (
                <div
                  className="grid min-w-[860px] grid-cols-[1.1fr_1.15fr_1.9fr_1.2fr_0.8fr_1fr] items-center gap-3 border-b border-[var(--border)] py-[0.8rem] text-[0.86rem] last:border-b-0 last:pb-0"
                  key={transaction.transactionId}
                >
                  <span>{formatTransactionDate(transaction.date)}</span>
                  <span>{transaction.transactionId}</span>
                  <span>{transaction.senderReceiverName}</span>
                  <span>{transaction.transactionCategory}</span>
                  <span>{transaction.transactionType}</span>
                  <span
                    className={`text-right font-bold ${
                      isCredit ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}
                  >
                    {formatCurrency(signedAmount, income.currency)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </article>

      <div className="flex items-center justify-end gap-[0.65rem] max-sm:justify-between">
        <button
          className="cursor-pointer rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[0.84rem] font-semibold text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={clampedPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          type="button"
        >
          Previous
        </button>
        <p className="m-0 text-[0.84rem] text-[var(--text-muted)]">
          Page {clampedPage} of {totalPages}
        </p>
        <button
          className="cursor-pointer rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[0.84rem] font-semibold text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={clampedPage === totalPages}
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          type="button"
        >
          Next
        </button>
      </div>
    </section>
  )
}

export default Transactions
