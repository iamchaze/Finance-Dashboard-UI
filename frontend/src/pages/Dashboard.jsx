import { useMemo } from 'react'
import { useAppState } from '../context/AppStateContext'

const CATEGORY_COLORS = ['#4f6bed', '#17a2a4', '#f28b30', '#d94d9c', '#7f62ff', '#56b16a', '#de5d5d']

const formatCurrency = (value, currency = 'USD', maxFractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: maxFractionDigits === 0 ? 0 : 2,
  }).format(value)

const formatMonthLabel = (dateValue) =>
  new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${dateValue}-01T00:00:00`))

const formatTransactionDate = (dateValue) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(dateValue))

const buildTrendCoordinates = (points, width, height, padding) => {
  const values = points.map((item) => item.balance)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0

  return points.map((item, index) => {
    const x = padding + stepX * index
    const y = height - padding - ((item.balance - minValue) / range) * (height - padding * 2)
    return { ...item, x, y }
  })
}

const buildPieGradient = (segments) => {
  const total = segments.reduce((sum, segment) => sum + segment.amount, 0)
  let current = 0

  const slices = segments.map((segment) => {
    const sweep = (segment.amount / total) * 360
    const stop = current + sweep
    const chunk = `${segment.color} ${current}deg ${stop}deg`
    current = stop
    return chunk
  })

  return `conic-gradient(${slices.join(', ')})`
}

const Dashboard = ({ showFinancialValues }) => {
  const {
    filters,
    filteredTransactions,
    income,
    investments,
    sortedTransactions,
    spendingByCategory,
    updateFilter,
  } = useAppState()

  const spendingBreakdown = useMemo(() => {
    return spendingByCategory.map((item, index) => ({
      ...item,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
  }, [spendingByCategory])

  const totalSpendByCategory = spendingBreakdown.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = totalSpendByCategory

  const totalBalance = useMemo(() => {
    const investmentValue = investments.reduce((sum, investment) => sum + investment.currentValue, 0)
    const transactionNet = sortedTransactions.reduce((sum, transaction) => {
      const isCredit = transaction.transactionType.toLowerCase() === 'credit'
      return sum + (isCredit ? transaction.amount : -transaction.amount)
    }, 0)

    return Math.max(0, investmentValue + transactionNet)
  }, [investments, sortedTransactions])

  const monthlySnapshot = useMemo(() => {
    const monthBuckets = new Map()
    const ascendingTransactions = [...sortedTransactions].sort((a, b) => new Date(a.date) - new Date(b.date))

    ascendingTransactions.forEach((transaction) => {
      const monthKey = transaction.date.slice(0, 7)
      const existing = monthBuckets.get(monthKey) || {
        month: formatMonthLabel(monthKey),
        key: monthKey,
        income: 0,
        expenses: 0,
      }

      if (transaction.transactionType.toLowerCase() === 'credit') {
        existing.income += transaction.amount
      } else {
        existing.expenses += transaction.amount
      }

      monthBuckets.set(monthKey, existing)
    })

    const sortedBuckets = [...monthBuckets.values()].sort((a, b) => a.key.localeCompare(b.key))
    const totalNetChange = sortedBuckets.reduce((sum, month) => sum + month.income - month.expenses, 0)

    const openingBalance = Math.max(totalBalance - totalNetChange, 0)
    const trendState = sortedBuckets.reduce(
      (state, month) => {
        const balance = state.previousBalance + month.income - month.expenses
        return {
          previousBalance: balance,
          items: [
            ...state.items,
            {
              month: month.month,
              income: month.income,
              expenses: month.expenses,
              balance,
            },
          ],
        }
      },
      { previousBalance: openingBalance, items: [] },
    )

    return trendState.items
  }, [sortedTransactions, totalBalance])

  const trendCoordinates = buildTrendCoordinates(monthlySnapshot, 680, 260, 32)
  const chartPoints = trendCoordinates.map((point) => `${point.x},${point.y}`).join(' ')
  const recentTransactions = filteredTransactions.slice(0, 5)

  const selectedIncome =
    filters.incomePeriod === 'yearly' ? income.yearlyProjectedTotal : income.monthlyTotal
  const incomePeriodLabel = filters.incomePeriod === 'yearly' ? 'Last year\'s income' : 'Monthly recurring income'

  return (
    <section className="dashboard">
      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Total Balance</p>
          <p className="summary-value">
            {showFinancialValues ? formatCurrency(totalBalance, income.currency) : '******'}
          </p>
          <span className="summary-footnote">From investments and recent cash flow</span>
        </article>

        <article className="summary-card">
          <div className="summary-head">
            <p className="summary-label">Income</p>
            <label className="visually-hidden" htmlFor="income-period">
              Select income period
            </label>
            <select
              className="income-filter-select"
              id="income-period"
              onChange={(event) => updateFilter('incomePeriod', event.target.value)}
              value={filters.incomePeriod}
            >
              <option value="monthly">Per Month</option>
              <option value="yearly">Per Year</option>
            </select>
          </div>
          <p className="summary-value">
            {showFinancialValues ? formatCurrency(selectedIncome, income.currency) : '******'}
          </p>
          <span className="summary-footnote">{incomePeriodLabel}</span>
        </article>

        <article className="summary-card">
          <p className="summary-label">Expenses</p>
          <p className="summary-value">
            {showFinancialValues ? formatCurrency(totalExpenses, income.currency) : '******'}
          </p>
          <span className="summary-footnote">Spending by category</span>
        </article>
      </div>

      <div className="visual-grid">
        <article className="dashboard-panel">
          <div className="panel-head">
            <h2>Balance Trend</h2>
            <p>Based on the last 3 months of transactions</p>
          </div>
          <div className="trend-chart-wrap">
            <svg aria-label="Balance trend chart" className="trend-chart" role="img" viewBox="0 0 680 260">
              <polyline className="trend-line-shadow" fill="none" points={chartPoints} />
              <polyline className="trend-line" fill="none" points={chartPoints} />
              {trendCoordinates.map((item) => (
                <circle className="trend-dot" cx={item.x} cy={item.y} key={item.month} r="5" />
              ))}
            </svg>
          </div>
          <div className="trend-labels" style={{ gridTemplateColumns: `repeat(${Math.max(monthlySnapshot.length, 1)}, minmax(0, 1fr))` }}>
            {monthlySnapshot.map((item) => (
              <span key={item.month}>{item.month}</span>
            ))}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-head">
            <h2>Spending Breakdown</h2>
            <p>Categorical view of expenses</p>
          </div>

          <div className="breakdown-layout">
            <div className="donut-wrap">
              <div
                aria-label="Spending category donut chart"
                className="donut-chart"
                role="img"
                style={{ '--donut-gradient': buildPieGradient(spendingBreakdown) }}
              />
              <div className="donut-center">
                <strong>{formatCurrency(totalSpendByCategory, income.currency)}</strong>
                <span>Total spend</span>
              </div>
            </div>

            <div className="category-list">
              {spendingBreakdown.map((item) => {
                const pct = ((item.amount / totalSpendByCategory) * 100).toFixed(1)
                return (
                  <div className="category-item" key={item.category}>
                    <div className="category-label-row">
                      <span className="category-name">
                        <span className="category-dot" style={{ backgroundColor: item.color }} />
                        {item.category}
                      </span>
                      <span className="category-value">
                        {formatCurrency(item.amount, income.currency)}
                      </span>
                    </div>
                    <div className="category-bar">
                      <span style={{ backgroundColor: item.color, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </article>
      </div>

      <article className="dashboard-panel transactions-panel">
        <div className="panel-head panel-head-row">
          <div>
            <h2>Recent Transactions</h2>
            <p>Latest account activity</p>
          </div>
          <a className="view-all-link" href="#/transactions">
            View All
          </a>
        </div>
        <div className="transactions-list">
          {recentTransactions.length === 0 ? (
            <p className="empty-state-message">No transactions match the selected filters.</p>
          ) : (
            recentTransactions.map((transaction) => {
              const isCredit = transaction.transactionType.toLowerCase() === 'credit'
              const signedAmount = isCredit ? transaction.amount : -transaction.amount
              return (
                <div className="transaction-row" key={transaction.transactionId}>
                  <div>
                    <p className="transaction-name">{transaction.senderReceiverName}</p>
                    <span className="transaction-date">
                      {formatTransactionDate(transaction.date)} | {transaction.transactionId}
                    </span>
                  </div>
                  <p className={`transaction-amount ${isCredit ? 'credit' : 'debit'}`}>
                    {formatCurrency(signedAmount, income.currency, 2)}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </article>
    </section>
  )
}

export default Dashboard
