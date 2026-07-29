import { createContext, useContext, type ReactNode } from 'react'
import { useProjects } from './useProjects'
import i18n from '../i18n'

export type ProjectsApi = ReturnType<typeof useProjects>

const ProjectsContext = createContext<ProjectsApi | null>(null)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const value = useProjects()
  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjectsContext() {
  const ctx = useContext(ProjectsContext)
  if (!ctx)
    throw new Error(
      i18n.t('hooks.useProjectsContextError'),
    )
  return ctx
}
