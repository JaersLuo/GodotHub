import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { IconPlus, IconX } from '../Icons'
import type { ChangelogEntry, ChangelogNote } from '../../types'

interface Props {
  entry?: ChangelogEntry
  onClose: () => void
  onSave: (
    version: string,
    date: string,
    notes: ChangelogNote[],
  ) => Promise<void>
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export function ChangelogEntryModal({ entry, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [version, setVersion] = useState(entry?.version ?? '')
  const [date, setDate] = useState(entry?.date ?? todayIso())
  const [notes, setNotes] = useState<ChangelogNote[]>(
    entry?.notes.length ? entry.notes : [{ category: 'add', text: '' }],
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const CATEGORIES = [
    { value: 'add' as const, label: t('changelogEntry.categoryAdd'), color: 'text-mint' },
    { value: 'fix' as const, label: t('changelogEntry.categoryFix'), color: 'text-danger' },
    { value: 'improve' as const, label: t('changelogEntry.categoryImprove'), color: 'text-accent-bright' },
  ]

  const setNote = (i: number, patch: Partial<ChangelogNote>) =>
    setNotes((prev) =>
      prev.map((n, idx) => (idx === i ? { ...n, ...patch } : n)),
    )
  const addNote = () =>
    setNotes((prev) => [...prev, { category: 'add', text: '' }])
  const removeNote = (i: number) =>
    setNotes((prev) =>
      prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i),
    )

  const submit = async () => {
    if (!version.trim()) {
      setError(t('changelogEntry.validationError'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave(version, date, notes)
      onClose()
    } catch (e) {
      setError(String(e))
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
        className="bg-surface border border-line rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6 p-7 pb-0 shrink-0">
          <div>
            <h3 className="font-display font-semibold text-lg">
              {entry ? t('changelogEntry.editTitle') : t('changelogEntry.newTitle')}
            </h3>
            <p className="text-xs text-muted mt-1.5">
              {t('changelogEntry.description')}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-medium text-muted">{t('changelogEntry.version')}</label>
              <input
                autoFocus
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="focus-ring bg-raised border border-line rounded-lg px-3.5 py-2.5 text-sm focus:border-accent-dim transition-colors"
                placeholder="v1.1.5"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-medium text-muted">{t('changelogEntry.date')}</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="focus-ring bg-raised border border-line rounded-lg px-3.5 py-2.5 text-sm focus:border-accent-dim transition-colors"
                placeholder="2026-07-13"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-7 overflow-y-auto min-h-0">
          <span className="text-xs font-medium text-muted">{t('changelogEntry.whatChanged')}</span>
          <div className="flex flex-col gap-2">
            {notes.map((note, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex rounded-md border border-line overflow-hidden shrink-0">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNote(i, { category: c.value })}
                      className={`px-2 py-1.5 text-[10px] font-medium transition-colors ${
                        note.category === c.value
                          ? `bg-raised ${c.color}`
                          : 'text-muted hover:bg-raised/50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <input
                  value={note.text}
                  onChange={(e) => setNote(i, { text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addNote()
                    }
                  }}
                  className="focus-ring flex-1 bg-raised border border-line rounded-lg px-3.5 py-2 text-sm focus:border-accent-dim transition-colors"
                  placeholder={t('changelogEntry.notePlaceholder')}
                />
                {notes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeNote(i)}
                    aria-label={t('changelogEntry.removeLine')}
                    className="focus-ring cursor-pointer p-1.5 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={addNote}
            className="focus-ring cursor-pointer self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-ink hover:bg-raised transition-colors"
          >
            <IconPlus className="w-3 h-3" />
            {t('changelogEntry.addLine')}
          </motion.button>
        </div>

        <div className="flex flex-col gap-3 p-7 pt-4 border-t border-line shrink-0">
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2.5">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="focus-ring cursor-pointer px-4 py-2.5 rounded-lg text-sm text-muted hover:text-ink hover:bg-raised transition-colors"
            >
              {t('common.cancel')}
            </motion.button>
            <motion.button
              whileHover={busy ? undefined : { y: -1 }}
              whileTap={busy ? undefined : { scale: 0.96 }}
              onClick={submit}
              disabled={busy}
              className="focus-ring px-4 cursor-pointer py-2.5 rounded-lg bg-accent hover:bg-accent-bright disabled:opacity-50 text-sm font-medium text-white transition-colors"
            >
              {busy ? t('common.saving') : entry ? t('common.saveChanges') : t('common.addEntry')}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
