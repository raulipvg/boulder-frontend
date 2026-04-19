import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface HeaderContentContextValue {
  headerContent: ReactNode | null
  setHeaderContent: (content: ReactNode | null) => void
}

const HeaderContentContext = createContext<HeaderContentContextValue>({
  headerContent: null,
  setHeaderContent: () => {},
})

export function HeaderContentProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<ReactNode | null>(null)

  const value = useMemo(() => ({
    headerContent,
    setHeaderContent,
  }), [headerContent])

  return (
    <HeaderContentContext.Provider value={value}>
      {children}
    </HeaderContentContext.Provider>
  )
}

export function useHeaderContent() {
  return useContext(HeaderContentContext)
}