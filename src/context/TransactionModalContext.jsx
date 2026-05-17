import { createContext, useContext, useState } from 'react'
import AddTransactionModal from '../components/transactions/AddTransactionModal'

const Ctx = createContext(null)

export function TransactionModalProvider({ children }) {
  const [state, setState] = useState(null) // null = closed

  function openTransactionModal(arg = {}) {
    setState(arg)
  }

  const isEdit = state !== null && !!state.id
  return (
    <Ctx.Provider value={{ openTransactionModal }}>
      {children}
      {state !== null && (
        <AddTransactionModal
          transaction={isEdit ? state : null}
          defaults={isEdit ? {} : state}
          onClose={() => setState(null)}
        />
      )}
    </Ctx.Provider>
  )
}

export function useTransactionModal() {
  return useContext(Ctx)
}
