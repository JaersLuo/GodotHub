import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation, Trans } from 'react-i18next'
import { api } from '../../lib/api'
import { useTaskTray } from '../../hooks/useTaskTray'

interface Props {
  defaultLocation?: string | null
  onClose: () => void
  onCloned: (projectPath: string) => void
}

export function CloneRepoModal({
  defaultLocation,
  onClose,
  onCloned,
}: Props) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [location, setLocation] = useState(defaultLocation ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { registerTask, updateTask, unregisterTask } = useTaskTray()

  const pickLocation = async () => {
    const folder = await api.pickFolder()
    if (folder) setLocation(folder)
  }

  const submit = async () => {
    if (!url.trim()) {
      setError(t('cloneRepo.errorUrlRequired'))
      return
    }
    if (!location) {
      setError(t('cloneRepo.errorLocationRequired'))
      return
    }

    setBusy(true)
    setError(null)

    const repoName = url.trim().split('/').pop()?.replace('.git', '') || 'repository'
    const taskId = `clone-${Date.now()}`

    registerTask({
      id: taskId,
      type: 'clone-repo',
      label: t('cloneRepo.cloningRepo', { repoName }),
      description: t('cloneRepo.starting'),
      progress: null,
      status: 'running',
    })

    try {
      const clonedPath = await api.cloneRepo(url.trim(), location)
      updateTask(taskId, {
        description: t('cloneRepo.importingProject'),
        status: 'running',
      })
      const project = await api.importProject(clonedPath, '')
      updateTask(taskId, { status: 'completed', description: t('cloneRepo.done') })
      setTimeout(() => unregisterTask(taskId), 3000)
      onCloned(project.id)
    } catch (e) {
      setError(String(e))
      updateTask(taskId, {
        status: 'error',
        errorMessage: String(e),
      })
      setTimeout(() => unregisterTask(taskId), 6000)
    } finally {
      setBusy(false)
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
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="bg-surface border border-line rounded-2xl p-7 w-full max-w-lg flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-display font-semibold text-lg">
            {t('cloneRepo.title')}
          </h3>
          <p className="text-xs text-muted mt-1.5">
            <Trans i18nKey="cloneRepo.description" ns="cloneRepo">
              Clone a Git repository and import it as a Godot project. The folder
              must contain a <code className="text-ink">project.godot</code> file.
            </Trans>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted">
            {t('cloneRepo.repositoryUrl')}
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('cloneRepo.urlPlaceholder')}
            className="focus-ring bg-raised border border-line rounded-lg px-3.5 py-2.5 text-sm font-mono text-ink focus:border-accent-dim transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted">
            {t('cloneRepo.destinationFolder')}
          </label>
          <div className="flex gap-2.5">
            <input
              value={location}
              readOnly
              className="flex-1 bg-raised border border-line rounded-lg px-3.5 py-2.5 text-sm font-mono text-muted"
              placeholder={t('cloneRepo.chooseFolder')}
            />
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={pickLocation}
              className="focus-ring cursor-pointer px-4 py-2.5 rounded-lg border border-line hover:border-accent-dim hover:bg-raised text-sm transition-colors"
            >
              {t('cloneRepo.browse')}
            </motion.button>
          </div>
          <p className="text-[11px] text-muted/60">
            {t('cloneRepo.subfolderNote')}
          </p>
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2.5 mt-1">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            disabled={busy}
            className="focus-ring cursor-pointer px-4 py-2.5 rounded-lg text-sm text-muted hover:text-ink hover:bg-raised transition-colors"
          >
            {t('common.cancel')}
          </motion.button>
          <motion.button
            whileHover={busy ? undefined : { y: -1 }}
            whileTap={busy ? undefined : { scale: 0.96 }}
            onClick={submit}
            disabled={busy}
            className="focus-ring cursor-pointer px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-bright disabled:opacity-50 text-sm font-medium text-white transition-colors"
          >
            {busy ? t('cloneRepo.cloning') : t('cloneRepo.cloneAndImport')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
