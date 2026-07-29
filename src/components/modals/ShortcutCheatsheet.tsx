import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { IconX } from '../Icons'

interface ShortcutGroup {
  label: string
  shortcuts: { keys: string; desc: string }[]
}

const MODIFIER = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'

interface Props {
  onClose: () => void
  paletteKey: string
}

export function ShortcutCheatsheet({ onClose, paletteKey }: Props) {
  const { t } = useTranslation()
  
  const groups: ShortcutGroup[] = [
    {
      label: t('shortcuts.groups.navigation'),
      shortcuts: [
        { keys: `${MODIFIER}1`, desc: t('shortcuts.items.projects') },
        { keys: `${MODIFIER}2`, desc: t('shortcuts.items.versions') },
        { keys: `${MODIFIER}3`, desc: t('shortcuts.items.news') },
        { keys: `${MODIFIER}4`, desc: t('shortcuts.items.templates') },
        { keys: `${MODIFIER},`, desc: t('shortcuts.items.settings') },
      ],
    },
    {
      label: t('shortcuts.groups.commandPalette'),
      shortcuts: [
        {
          keys: `${MODIFIER}${paletteKey.toUpperCase()}`,
          desc: t('shortcuts.items.openCommandPalette'),
        },
        { keys: '↑↓', desc: t('shortcuts.items.navigateResults') },
        { keys: '↵', desc: t('shortcuts.items.select') },
        { keys: 'Esc', desc: t('shortcuts.items.close') },
      ],
    },
    {
      label: t('shortcuts.groups.projects'),
      shortcuts: [
        { keys: `${MODIFIER}N`, desc: t('shortcuts.items.newProject') },
      ],
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-lg">
              {t('shortcuts.title')}
            </h3>
            <p className="text-xs text-muted mt-1">
              {t('shortcuts.description')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="focus-ring cursor-pointer p-2 rounded-lg text-muted hover:text-ink hover:bg-raised transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted/50 mb-2 px-1">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.desc}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-raised/50 transition-colors"
                  >
                    <span className="text-sm text-ink">{s.desc}</span>
                    <kbd className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-raised border border-line text-muted/70 shrink-0 ml-4">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-line flex justify-center">
          <p className="text-[10px] text-muted/50">
            {t('shortcuts.tipPrefix')}{' '}
            <kbd className="font-mono px-1 bg-raised rounded border border-line">
              {MODIFIER}{paletteKey.toUpperCase()}
            </kbd>{' '}
            {t('shortcuts.tipSuffix')}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
