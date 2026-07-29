import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { IconChevronDown } from '../Icons'

export function LanguageSelector() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const languages = [
    { code: 'en', label: t('language.english') },
    { code: 'zh', label: t('language.chinese') },
  ]

  const currentLang = i18n.language || 'en'
  const currentLabel = languages.find((l) => l.code === currentLang)?.label || 'English'

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('godothub_language', code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`focus-ring cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-lg bg-raised border text-xs text-ink transition-colors ${
          open ? 'border-accent' : 'border-line hover:border-accent-dim'
        }`}
      >
        <span className="truncate">{currentLabel}</span>
        <IconChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-20 top-full mt-2 w-full min-w-32 rounded-xl border border-line bg-surface shadow-2xl shadow-black/40 p-1.5"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center cursor-pointer text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  currentLang === lang.code
                    ? 'bg-accent/20 text-accent-bright'
                    : 'text-ink hover:bg-raised'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
