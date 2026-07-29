import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

function ErrorBoundaryUI({
  error,
}: {
  error: Error
}) {
  const { t } = useTranslation('errorBoundary')

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
        background: '#1e1f22',
        color: '#f2f3f5',
        fontFamily: 'sans-serif',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>{t('somethingWentWrong')}</h1>
      <p style={{ fontSize: 13, color: '#949ba4', maxWidth: 480 }}>
        {t('errorDescription')}
      </p>
      <pre
        style={{
          fontSize: 11,
          color: '#f23f42',
          background: '#2b2d31',
          padding: 12,
          borderRadius: 10,
          maxWidth: 560,
          overflow: 'auto',
          textAlign: 'left',
        }}
      >
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '9px 18px',
          borderRadius: 10,
          border: '1px solid #3f4147',
          background: 'transparent',
          color: '#f2f3f5',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        {t('reload')}
      </button>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('GodotHub crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return <ErrorBoundaryUI error={error} />
  }
}
