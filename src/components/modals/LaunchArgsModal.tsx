import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface Props {
  projectName: string
  currentArgs: string
  onSave: (args: string) => void
  onClose: () => void
}

const SUGGESTIONS = [
  { label: '--debug', descKey: 'launchArgs.suggestionDebug' },
  { label: '--single-window', descKey: 'launchArgs.suggestionSingleWindow' },
  { label: '--rendering-driver opengl3', descKey: 'launchArgs.suggestionOpengl3' },
  { label: '--rendering-driver vulkan', descKey: 'launchArgs.suggestionVulkan' },
  { label: '--headless', descKey: 'launchArgs.suggestionHeadless' },
  { label: '--verbose', descKey: 'launchArgs.suggestionVerbose' },
  { label: '--editor', descKey: 'launchArgs.suggestionEditor' },
  { label: '--build-solutions', descKey: 'launchArgs.suggestionBuildSolutions' },
  { label: '--gpu-index 1', descKey: 'launchArgs.suggestionGpuIndex1' },
] as const

export function LaunchArgsModal({
  projectName,
  currentArgs,
  onSave,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [args, setArgs] = useState(currentArgs)

  const append = (flag: string) => {
    setArgs((prev) => {
      const trimmed = prev.trim()
      return trimmed ? `${trimmed} ${flag}` : flag
    })
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
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="bg-surface border border-line rounded-2xl p-7 w-full max-w-lg flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-display font-semibold text-lg">
            {t('launchArgs.title')}
          </h3>
          <p className="text-xs text-muted mt-1.5">
            {t('launchArgs.description')}{' '}
            <span className="font-medium text-ink">{projectName}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted">{t('launchArgs.argumentsLabel')}</label>
          <input
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            placeholder={t('launchArgs.argumentsPlaceholder')}
            className="focus-ring bg-raised border border-line rounded-lg px-3.5 py-2.5 text-sm font-mono text-ink focus:border-accent-dim transition-colors"
          />
          <p className="text-[11px] text-muted/60">
            {t('launchArgs.argumentsHint')}{' '}
            <code className="text-muted">--rendering-driver opengl3</code>{' '}
            {t('launchArgs.argumentsHintContinuation')}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">{t('launchArgs.suggestions')}</span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => append(s.label)}
                title={t(s.descKey)}
                className="focus-ring cursor-pointer px-2.5 py-1 rounded-md bg-raised border border-line text-[11px] font-mono text-muted hover:text-ink hover:border-accent-dim transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-1">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            className="focus-ring cursor-pointer px-4 py-2.5 rounded-lg text-sm text-muted hover:text-ink hover:bg-raised transition-colors"
          >
            {t('common.cancel')}
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSave(args.trim())}
            className="focus-ring cursor-pointer px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-bright text-sm font-medium text-white transition-colors"
          >
            {t('common.save')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
