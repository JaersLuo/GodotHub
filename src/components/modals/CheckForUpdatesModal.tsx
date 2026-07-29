import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { check } from '@tauri-apps/plugin-updater'
import { getVersion } from '@tauri-apps/api/app'
import { IconRefresh, IconDownload, IconCheck, IconX } from '../Icons'

type UpdateState =
  | { type: 'checking' }
  | { type: 'available'; version: string; notes: string | null; downloadAndInstall: () => Promise<void> }
  | { type: 'downloading'; progress: number }
  | { type: 'done' }
  | { type: 'uptodate' }
  | { type: 'error'; message: string }

interface Props {
  onClose: () => void
  mode?: 'background' | 'manual'
}

export function CheckForUpdatesModal({ onClose, mode = 'manual' }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<UpdateState>({ type: 'checking' })
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const doCheck = useCallback(async () => {
    setState({ type: 'checking' })
    try {
      const update = await check()
      if (update) {
        setState({
          type: 'available',
          version: update.version,
          notes: update.body ?? null,
          downloadAndInstall: async () => {
            setState({ type: 'downloading', progress: 0 })
            try {
              await update.downloadAndInstall((progressEvent) => {
                const ev = progressEvent as Record<string, unknown>
                if (ev && typeof ev === 'object' && 'event' in ev && (ev.event === 'Progress' || ev.event === 'DownloadProgress')) {
                  const data = ev.data as Record<string, unknown> | undefined
                  if (data && typeof data === 'object' && 'progress' in data) {
                    const p = (data as Record<string, number>).progress
                    if (typeof p === 'number') {
                      setState({ type: 'downloading', progress: p })
                    }
                  }
                }
              })
              setState({ type: 'done' })
            } catch (e) {
              setState({ type: 'error', message: String(e) })
            }
          },
        })
      } else if (mode === 'background') {
        // Silent close - no update found
        onCloseRef.current()
        return
      } else {
        setState({ type: 'uptodate' })
      }
    } catch (e) {
      if (mode === 'background') {
        // Silent close on error during background check
        onCloseRef.current()
        return
      }
      setState({ type: 'error', message: String(e) })
    }
  }, [mode])

  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(() => setCurrentVersion(null))
  }, [])

  useEffect(() => {
    doCheck()
  }, [doCheck])

  const handleInstall = async () => {
    if (state.type === 'available') {
      await state.downloadAndInstall()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-100 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl shadow-black/40 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-lg text-ink">
            {t('updates:title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring cursor-pointer p-1.5 rounded-lg text-muted hover:text-ink hover:bg-raised transition-colors"
            aria-label={t('common:close')}
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-5 py-8">
          {state.type === 'checking' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <IconRefresh className="w-6 h-6 text-accent animate-spin" />
              </div>
              <p className="text-sm text-muted">{t('updates:checking')}</p>
            </div>
          )}

          {state.type === 'uptodate' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-mint/10 flex items-center justify-center">
                <IconCheck className="w-6 h-6 text-mint" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink">{t('updates:upToDate')}</p>
                <p className="text-xs text-muted mt-1">
                  {t('updates:latestVersion', { version: currentVersion ?? '?' })}
                </p>
              </div>
            </div>
          )}

          {state.type === 'available' && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <IconDownload className="w-6 h-6 text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink">
                  {t('updates:versionAvailable', { version: state.version })}
                </p>
                <p className="text-xs text-muted mt-1">
                  {t('updates:downloadInstallPrompt')}
                </p>
              </div>
              {state.notes && (
                <div className="w-full bg-raised rounded-xl border border-line p-4 max-h-32 overflow-y-auto">
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">
                    {t('updates:releaseNotes')}
                  </p>
                  <pre className="text-xs text-ink whitespace-pre-wrap font-sans leading-relaxed">
                    {state.notes}
                  </pre>
                </div>
              )}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleInstall}
                className="focus-ring cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-bright text-sm font-medium text-white transition-colors"
              >
                <IconDownload className="w-4 h-4" />
                {t('updates:downloadInstall')}
              </motion.button>
            </div>
          )}

          {state.type === 'downloading' && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <IconDownload className="w-6 h-6 text-accent animate-pulse" />
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-medium text-ink">{t('updates:downloading')}</p>
                <p className="text-xs text-muted mt-1">
                  {t('updates:percentComplete', { percent: Math.round(state.progress * 100) })}
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.round(state.progress * 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {state.type === 'done' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-mint/10 flex items-center justify-center">
                <IconCheck className="w-6 h-6 text-mint" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink">{t('updates:downloaded')}</p>
                <p className="text-xs text-muted mt-1">
                  {t('updates:restartToApply')}
                </p>
              </div>
              <p className="text-[11px] text-muted/70 text-center max-w-xs">
                {t('updates:downloadedDescription')}
              </p>
            </div>
          )}

          {state.type === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
                <IconX className="w-6 h-6 text-danger" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink">{t('updates:checkFailed')}</p>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  {state.message}
                </p>
              </div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={doCheck}
                className="focus-ring cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-lg border border-line hover:border-accent-dim hover:bg-raised text-sm font-medium text-ink transition-colors"
              >
                <IconRefresh className="w-4 h-4" />
                {t('updates:tryAgain')}
              </motion.button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-line">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            className="focus-ring cursor-pointer px-4 py-2 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-raised transition-colors"
          >
            {t('common:close')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
