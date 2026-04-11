import { createContext, useContext, useState } from 'react'
import AddTransactionModal from '../components/transactions/AddTransactionModal'

const Ctx = createContext(null)

export function TransactionModalProvider({ children }) {
  const [state, setState] = useState(null) // null = closed

  function openTransactionModal(defaults = {}) {
    setState(defaults)
  }

  return (
    <Ctx.Provider value={{ openTransactionModal }}>
      {children}
      {state !== null && (
        <AddTransactionModal defaults={state} onClose={() => setState(null)} />
      )}
    </Ctx.Provider>
  )
}

export function useTransactionModal() {
  return useContext(Ctx)
}
