import { useState } from 'react'

export function useCashLabel() {
  const [label, setLabel] = useState('Cash')
  return { label, setLabel }
}
