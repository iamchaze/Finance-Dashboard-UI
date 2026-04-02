import { createContext, useContext, useMemo, useState } from 'react'
import fallbackData from '../data/fallbackData'

const AppStateContext = createContext(null)

const DEFAULT_FILTERS = {
  incomePeriod: 'monthly',
  transactionType: 'all',
  transactionCategory: 'all',
  transactionSearch: '',
}

const ROLE_OPTIONS = [
  fallbackData.user.role,
  'Senior Product Manager',
  'Financial Analyst',
  'Founder',
  'Software Engineer',
]

export const AppStateProvider = ({ children }) => {
  const [transactionsData, setTransactionsData] = useState(fallbackData.recentThreeMonthsTransactions)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedRole, setSelectedRole] = useState(fallbackData.user.role)

  const sortedTransactions = useMemo(() => {
    return [...transactionsData].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactionsData])

  const transactionCategories = useMemo(() => {
    const categories = new Set(transactionsData.map((transaction) => transaction.transactionCategory))
    return ['all', ...categories]
  }, [transactionsData])

  const filteredTransactions = useMemo(() => {
    const searchTerm = filters.transactionSearch.trim().toLowerCase()

    return sortedTransactions.filter((transaction) => {
      const matchesType =
        filters.transactionType === 'all' ||
        transaction.transactionType.toLowerCase() === filters.transactionType

      const matchesCategory =
        filters.transactionCategory === 'all' ||
        transaction.transactionCategory === filters.transactionCategory

      const matchesSearch =
        !searchTerm ||
        transaction.transactionId.toLowerCase().includes(searchTerm) ||
        transaction.senderReceiverName.toLowerCase().includes(searchTerm)

      return matchesType && matchesCategory && matchesSearch
    })
  }, [filters.transactionCategory, filters.transactionSearch, filters.transactionType, sortedTransactions])

  const updateFilter = (key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }))
  }

  const resetTransactionFilters = () => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      transactionType: 'all',
      transactionCategory: 'all',
      transactionSearch: '',
    }))
  }

  const value = {
    user: fallbackData.user,
    income: fallbackData.income,
    spendingByCategory: fallbackData.spendingByCategory,
    investments: fallbackData.investments,
    transactionsData,
    setTransactionsData,
    sortedTransactions,
    filteredTransactions,
    filters,
    updateFilter,
    resetTransactionFilters,
    selectedRole,
    setSelectedRole,
    roleOptions: [...new Set(ROLE_OPTIONS)],
    transactionCategories,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAppState = () => {
  const context = useContext(AppStateContext)

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }

  return context
}
