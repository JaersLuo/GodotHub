import { createContext, useContext, type ReactNode } from 'react'
import { useGodotVersions } from './useGodotVersions'
import i18n from '../i18n'

type GodotVersionsApi = ReturnType<typeof useGodotVersions>

const GodotVersionsContext = createContext<GodotVersionsApi | null>(null)

export function GodotVersionsProvider({ children }: { children: ReactNode }) {
  const value = useGodotVersions()
  return (
    <GodotVersionsContext.Provider value={value}>
      {children}
    </GodotVersionsContext.Provider>
  )
}

export function useGodotVersionsContext() {
  const ctx = useContext(GodotVersionsContext)
  if (!ctx)
    throw new Error(
      i18n.t('hooks.useGodotVersionsContextError'),
    )
  return ctx
}
