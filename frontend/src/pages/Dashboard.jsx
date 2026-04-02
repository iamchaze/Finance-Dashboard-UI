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

const IncomePeriodIcon = () => (
  <svg aria-hidden="true" className="income-switch-icon" viewBox="0 0 24 24">
    <path d="M8 3v3M16 3v3M4 9h16" />
    <rect height="14" rx="2.5" width="18" x="3" y="6" />
    <path d="m9 14 2 2 4-4" />
  </svg>
)

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
  const summaryCardClass =
    'min-h-[146px] min-w-[245px] flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]'
  const panelClass = 'rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 pb-5 shadow-[var(--shadow)]'

  return (
    <section className="grid gap-4">
      <div className="flex gap-3 overflow-x-auto pb-[0.15rem] [scrollbar-width:thin]">
        <article className={summaryCardClass}>
          <p className="m-0 text-[0.83rem] text-[var(--text-muted)]">Total Balance</p>
          <p className="m-[0.45rem_0_0.25rem] text-[clamp(1.35rem,2.9vw,2rem)] font-bold tracking-[-0.02em]">
            {showFinancialValues ? formatCurrency(totalBalance, income.currency) : '******'}
          </p>
          <span className="text-[0.78rem] text-[var(--text-muted)]">From investments and recent cash flow</span>
        </article>

        <article className={summaryCardClass}>
          <div className="flex items-center justify-between">
            <p className="m-0 text-[0.83rem] text-[var(--text-muted)]">Income</p>
            {showFinancialValues ? (
              <button
                aria-label="Toggle income period"
                className="inline-flex items-center gap-[0.35rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-[0.45rem] py-[0.32rem] text-[0.76rem] font-semibold text-[var(--text-main)]"
                onClick={() =>
                  updateFilter('incomePeriod', filters.incomePeriod === 'monthly' ? 'yearly' : 'monthly')
                }
                type="button"
              >
                <IncomePeriodIcon />
                {filters.incomePeriod === 'monthly' ? 'Per Month' : 'Per Year'}
              </button>
            ) : null}
          </div>
          <p className="m-[0.45rem_0_0.25rem] text-[clamp(1.35rem,2.9vw,2rem)] font-bold tracking-[-0.02em]">
            {showFinancialValues ? formatCurrency(selectedIncome, income.currency) : '******'}
          </p>
          <span className="text-[0.78rem] text-[var(--text-muted)]">{incomePeriodLabel}</span>
        </article>

        <article className={summaryCardClass}>
          <p className="m-0 text-[0.83rem] text-[var(--text-muted)]">Expenses</p>
          <p className="m-[0.45rem_0_0.25rem] text-[clamp(1.35rem,2.9vw,2rem)] font-bold tracking-[-0.02em]">
            {showFinancialValues ? formatCurrency(totalExpenses, income.currency) : '******'}
          </p>
          <span className="text-[0.78rem] text-[var(--text-muted)]">Spending by category</span>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <article className={panelClass}>
          <div className="mb-3.5">
            <h2 className="m-0 text-[1.02rem] font-bold">Balance Trend</h2>
            <p className="m-[0.25rem_0_0] text-[0.84rem] text-[var(--text-muted)]">
              Based on the last 3 months of transactions
            </p>
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
          <div
            className="mt-2 grid gap-1 text-xs text-[var(--text-muted)]"
            style={{ gridTemplateColumns: `repeat(${Math.max(monthlySnapshot.length, 1)}, minmax(0, 1fr))` }}
          >
            {monthlySnapshot.map((item) => (
              <span key={item.month}>{item.month}</span>
            ))}
          </div>
        </article>

        <article className={panelClass}>
          <div className="mb-3.5">
            <h2 className="m-0 text-[1.02rem] font-bold">Spending Breakdown</h2>
            <p className="m-[0.25rem_0_0] text-[0.84rem] text-[var(--text-muted)]">Categorical view of expenses</p>
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

      <article className={panelClass}>
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-[1.02rem] font-bold">Recent Transactions</h2>
            <p className="m-[0.25rem_0_0] text-[0.84rem] text-[var(--text-muted)]">Latest account activity</p>
          </div>
          <a
            className="rounded-[10px] border border-[var(--border)] px-[0.65rem] py-[0.4rem] text-[0.8rem] font-bold text-[var(--text-main)] no-underline transition hover:bg-[var(--surface-soft)]"
            href="#/transactions"
          >
            View All
          </a>
        </div>
        <div className="grid gap-[0.7rem]">
          {recentTransactions.length === 0 ? (
            <p className="m-[0.5rem_0_0] text-[var(--text-muted)]">No transactions match the selected filters.</p>
          ) : (
            recentTransactions.map((transaction) => {
              const isCredit = transaction.transactionType.toLowerCase() === 'credit'
              const signedAmount = isCredit ? transaction.amount : -transaction.amount
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-[0.65rem]"
                  key={transaction.transactionId}
                >
                  <div>
                    <p className="m-0 text-[0.92rem]">{transaction.senderReceiverName}</p>
                    <span className="block text-[0.76rem] text-[var(--text-muted)]">
                      {formatTransactionDate(transaction.date)} | {transaction.transactionId}
                    </span>
                  </div>
                  <p
                    className={`m-0 text-[0.92rem] font-bold ${
                      isCredit ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}
                  >
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
