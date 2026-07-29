import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconAlertTriangle, IconRefresh, IconBug } from './Icons'

interface Props {
  children: ReactNode
  name: string
}

interface State {
  error: Error | null
}

function ViewErrorBoundaryUI({
  name,
  children,
  error,
  onRetry,
}: {
  name: string
  children: ReactNode
  error: Error | null
  onRetry: () => void
}) {
  const { t } = useTranslation()

  if (!error) return children

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 px-6 py-12">
      <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
        <IconAlertTriangle className="w-6 h-6 text-danger" />
      </div>
      <div className="text-center max-w-sm">
        <h3 className="font-semibold text-sm text-ink mb-1">
          {t('viewErrorBoundary.encounteredError', { name })}
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          {t('viewErrorBoundary.errorDescription')}
        </p>
      </div>
      <pre className="text-[11px] text-danger/80 bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 max-w-full overflow-auto max-h-24 select-all">
        {error.message}
      </pre>
      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="focus-ring cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-bright text-xs font-medium text-white transition-colors"
        >
          <IconRefresh className="w-3.5 h-3.5" />
          {t('viewErrorBoundary.retry')}
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('app:report-bug'))}
          className="focus-ring cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-danger/40 text-danger hover:bg-danger/10 hover:border-danger text-xs font-medium transition-colors"
        >
          <IconBug className="w-3.5 h-3.5" />
          {t('viewErrorBoundary.reportBug')}
        </button>
      </div>
    </div>
  )
}

export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.name}] crashed:`, error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    return (
      <ViewErrorBoundaryUI
        name={this.props.name}
        children={this.props.children}
        error={this.state.error}
        onRetry={this.handleRetry}
      />
    )
  }
}
