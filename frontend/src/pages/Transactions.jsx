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
    <section className="transactions-page">
      <div className="transactions-page-head">
        <div>
          <h2>All Transactions</h2>
          <p>Transactions state is shared across the application</p>
        </div>
        <a className="view-all-link subtle" href="#/dashboard">
          Back to Dashboard
        </a>
      </div>

      <div className="transactions-filters">
        <label className="visually-hidden" htmlFor="filter-type">
          Filter by type
        </label>
        <select
          className="filter-select"
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

        <label className="visually-hidden" htmlFor="filter-category">
          Filter by category
        </label>
        <select
          className="filter-select"
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

        <label className="visually-hidden" htmlFor="filter-search">
          Search by transaction id or sender/receiver
        </label>
        <input
          className="filter-search"
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
          className="pagination-button"
          onClick={() => {
            resetTransactionFilters()
            setCurrentPage(1)
          }}
          type="button"
        >
          Reset Filters
        </button>
      </div>

      <article className="dashboard-panel transactions-table-panel">
        <div className="transactions-grid-row transactions-grid-head">
          <span>Date</span>
          <span>Transaction ID</span>
          <span>Sender/Receiver</span>
          <span>Category</span>
          <span>Type</span>
          <span className="amount-cell">Amount</span>
        </div>

        <div className="transactions-grid-body">
          {paginatedTransactions.length === 0 ? (
            <p className="empty-state-message">No transactions match the selected filters.</p>
          ) : (
            paginatedTransactions.map((transaction) => {
              const isCredit = transaction.transactionType.toLowerCase() === 'credit'
              const signedAmount = isCredit ? transaction.amount : -transaction.amount

              return (
                <div className="transactions-grid-row transactions-grid-item" key={transaction.transactionId}>
                  <span>{formatTransactionDate(transaction.date)}</span>
                  <span>{transaction.transactionId}</span>
                  <span>{transaction.senderReceiverName}</span>
                  <span>{transaction.transactionCategory}</span>
                  <span>{transaction.transactionType}</span>
                  <span className={`amount-cell ${isCredit ? 'credit' : 'debit'}`}>
                    {formatCurrency(signedAmount, income.currency)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </article>

      <div className="pagination-controls">
        <button
          className="pagination-button"
          disabled={clampedPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          type="button"
        >
          Previous
        </button>
        <p className="pagination-status">
          Page {clampedPage} of {totalPages}
        </p>
        <button
          className="pagination-button"
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
