import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useTranslation } from 'react-i18next'
import { version } from '../../../package.json'
import { IconBug, IconCopy, IconDownload, IconExternalLink, IconRefresh } from '../Icons'

interface Props {
  onClose: () => void
}

const BUG_REPORT_URL = 'https://github.com/RykoTheDev/GodotHub-Releases/issues/new'

interface CapturedError {
  time: string
  source: 'console.error' | 'window.onerror' | 'unhandledrejection'
  message: string
}

const MAX_CAPTURED = 20
let capturedErrors: CapturedError[] = []
let captureInstalled = false
let origConsoleError: typeof console.error | null = null
let origWindowOnError: typeof window.onerror | null = null
let unhandledRejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null

function installErrorCapture() {
  if (captureInstalled) return
  captureInstalled = true

  const push = (source: CapturedError['source'], message: string) => {
    capturedErrors = [
      { time: new Date().toLocaleTimeString(), source, message },
      ...capturedErrors,
    ].slice(0, MAX_CAPTURED)
  }

  origConsoleError = console.error
  console.error = (...args: unknown[]) => {
    push('console.error', args.map((a) => (typeof a === 'object' ? String(a) : String(a))).join(' '))
    origConsoleError!.apply(console, args)
  }

  origWindowOnError = window.onerror
  window.onerror = (_event, _source, _lineno, _colno, error) => {
    push('window.onerror', error?.message ?? String(_event))
    return origWindowOnError ? origWindowOnError.call(window, _event, _source, _lineno, _colno, error) : false
  }

  unhandledRejectionHandler = (e: PromiseRejectionEvent) => {
    push('unhandledrejection', e.reason?.message ?? String(e.reason))
  }
  window.addEventListener('unhandledrejection', unhandledRejectionHandler)
}

// Install error capture at module load time so errors are captured
// from app startup, not just when the modal opens.
installErrorCapture()

async function getGPUInfo(t: (key: string) => string): Promise<string> {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return t('report.webglNotAvailable')
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return t('report.gpuInfoUnavailable')
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    canvas.remove()
    return `${vendor}, ${renderer}`
  } catch {
    return t('report.gpuInfoUnavailable')
  }
}

async function buildReport(t: (key: string) => string): Promise<string> {
  const gpu = await getGPUInfo(t)

  const lines: string[] = [
    t('report.title'),
    '',
    `${t('report.version')}: ${version}`,
    `${t('report.date')}: ${new Date().toISOString().slice(0, 10)}`,
    '',
    t('report.system'),
    `${t('report.os')}: ${navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Mac OS X') || navigator.userAgent.includes('macOS') ? 'macOS' : navigator.userAgent.includes('Linux') ? 'Linux' : navigator.userAgent}`,
    `${t('report.platform')}: ${navigator.platform}`,
    `${t('report.language')}: ${navigator.language}`,
    `${t('report.cpuCores')}: ${navigator.hardwareConcurrency ?? t('report.unknown')}`,
    `${t('report.ram')}: ${(navigator as Navigator & { deviceMemory?: number }).deviceMemory ? `${(navigator as Navigator & { deviceMemory?: number }).deviceMemory} GB` : t('report.unknown')}`,
    `${t('report.screen')}: ${screen.width}x${screen.height} @${screen.colorDepth}bit`,
    `${t('report.gpu')}: ${gpu}`,
    `${t('report.userAgent')}: ${navigator.userAgent}`,
  ]

  if (capturedErrors.length > 0) {
    lines.push('', t('report.recentErrors'))
    for (const err of capturedErrors) {
      lines.push(`  [${err.time}] (${err.source}) ${err.message}`)
    }
  } else {
    lines.push('', t('report.recentErrors'), t('report.noErrorsCaptured'))
  }

  lines.push('', t('report.end'))
  return lines.join('\n')
}

function downloadReport(report: string) {
  const blob = new Blob([report], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `godothub-bug-report-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function BugReportModal({ onClose }: Props) {
  const { t } = useTranslation()
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    buildReport(t).then((r) => {
      if (!cancelled) {
        setReport(r)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
      // Don't uninstall the capture — we want errors to persist
      // across modal sessions so users can always see them.
    }
  }, [t])

  const handleCopy = async () => {
    if (!report) return
    try {
      await navigator.clipboard.writeText(report)
    } catch {
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="bg-surface border border-line rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-7 pt-7 pb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
            <IconBug className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">{t('title')}</h3>
            <p className="text-xs text-muted mt-0.5">
              {t('description', { version })}
            </p>
          </div>
        </div>

        {/* Report preview */}
        <div className="px-7 overflow-y-auto min-h-0 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconRefresh className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : (
            <div className="rounded-xl bg-base border border-line p-4 font-mono text-[11px] text-muted whitespace-pre-wrap break-all leading-relaxed max-h-[320px] overflow-y-auto select-all">
              {report}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 px-7 pt-4 pb-7 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!report}
            className="focus-ring cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-sm text-muted hover:text-ink hover:border-accent-dim hover:bg-raised transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconCopy className="w-4 h-4" />
            {t('copyLog')}
          </button>
          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => report && downloadReport(report)}
              disabled={!report}
              className="focus-ring cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-sm text-muted hover:text-ink hover:border-accent-dim hover:bg-raised transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconDownload className="w-4 h-4" />
              {t('downloadLog')}
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                openUrl(BUG_REPORT_URL)
                onClose()
              }}
              className="focus-ring cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg bg-danger hover:bg-danger/90 text-sm font-medium text-white transition-colors"
            >
              <IconExternalLink className="w-4 h-4" />
              {t('openGithubIssues')}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
