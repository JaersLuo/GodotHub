import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  IconBug,
  IconLayoutGrid,
  IconLayoutList,
  IconNews,
  IconGear,
  IconFolderPlus,
  IconImport,
  IconSearch,
  IconBookOpen,
  IconRefresh,
  IconBriefcase,
  IconNode,
  IconPlay,
  IconClock,
  IconCopy,
} from '../Icons'
import { getWorkspaceIcon } from '../../lib/workspaceIcons'
import { formatLastOpened } from '../../lib/lastOpened'
import { isMac } from '../../lib/platform'
import type { Project, InstalledGodotVersion, Workspace } from '../../types'

interface CommandItem {
  id: string
  label: string
  shortcut?: string
  icon: React.ReactNode
  section: string
  context?: 'projects' | 'versions'
  action: () => void
}

interface DynamicItem {
  id: string
  label: string
  sublabel: string
  shortcut?: string
  icon: React.ReactNode
  section: string
  action: () => void
}

function buildCommands(mod: string, paletteKey: string, t: (key: string) => string): CommandItem[] {
  return [
    {
      id: 'go-projects',
      label: t('commandPalette:commands.goToProjects'),
      shortcut: `${mod}1`,
      icon: <IconLayoutGrid className="w-4 h-4" />,
      section: t('commandPalette:sections.navigation'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 0 }))
      },
    },
    {
      id: 'go-versions',
      label: t('commandPalette:commands.goToVersions'),
      shortcut: `${mod}2`,
      icon: <IconLayoutList className="w-4 h-4" />,
      section: t('commandPalette:sections.navigation'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 1 }))
      },
    },
    {
      id: 'go-news',
      label: t('commandPalette:commands.goToNews'),
      shortcut: `${mod}3`,
      icon: <IconNews className="w-4 h-4" />,
      section: t('commandPalette:sections.navigation'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 2 }))
      },
    },
    {
      id: 'go-changelog',
      label: t('commandPalette:commands.openChangelog'),
      icon: <IconBookOpen className="w-4 h-4" />,
      section: t('commandPalette:sections.navigation'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 4 }))
      },
    },
    {
      id: 'go-templates',
      label: t('commandPalette:commands.goToTemplates'),
      shortcut: `${mod}4`,
      icon: <IconCopy className="w-4 h-4" />,
      section: t('commandPalette:sections.navigation'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 3 }))
      },
    },
    {
      id: 'go-settings',
      label: t('commandPalette:commands.openSettings'),
      shortcut: `${mod},`,
      icon: <IconGear className="w-4 h-4" />,
      section: t('commandPalette:sections.navigation'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 4 }))
      },
    },

    {
      id: 'new-project',
      label: t('commandPalette:commands.newProject'),
      shortcut: `${mod}N`,
      icon: <IconFolderPlus className="w-4 h-4" />,
      section: t('commandPalette:sections.projects'),
      context: 'projects',
      action: () => {
        window.dispatchEvent(new CustomEvent('app:new-project-request'))
      },
    },
    {
      id: 'import-project',
      label: t('commandPalette:commands.importProject'),
      icon: <IconImport className="w-4 h-4" />,
      section: t('commandPalette:sections.projects'),
      context: 'projects',
      action: () => {
        window.dispatchEvent(new CustomEvent('app:import-project-request'))
      },
    },
    {
      id: 'scan-projects',
      label: t('commandPalette:commands.scanForProjects'),
      icon: <IconRefresh className="w-4 h-4" />,
      section: t('commandPalette:sections.projects'),
      context: 'projects',
      action: () => {
        window.dispatchEvent(new CustomEvent('app:scan-projects-request'))
      },
    },

    {
      id: 'create-workspace',
      label: t('commandPalette:commands.createWorkspace'),
      icon: <IconBriefcase className="w-4 h-4" />,
      section: t('commandPalette:sections.workspaces'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:create-workspace-request'))
      },
    },

    {
      id: 'show-shortcuts',
      label: t('commandPalette:commands.keyboardShortcuts'),
      shortcut: `${mod}${paletteKey.toUpperCase()}`,
      icon: <IconSearch className="w-4 h-4" />,
      section: t('commandPalette:sections.help'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:show-shortcuts'))
      },
    },
    {
      id: 'report-bug',
      label: t('commandPalette:commands.reportBug'),
      icon: <IconBug className="w-4 h-4" />,
      section: t('commandPalette:sections.help'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:report-bug'))
      },
    },

    {
      id: 'scan-versions',
      label: t('commandPalette:commands.scanForEngines'),
      icon: <IconSearch className="w-4 h-4" />,
      section: t('commandPalette:sections.engines'),
      context: 'versions',
      action: () => {
        window.dispatchEvent(new CustomEvent('app:scan-versions'))
      },
    },
    {
      id: 'import-version',
      label: t('commandPalette:commands.importVersion'),
      icon: <IconImport className="w-4 h-4" />,
      section: t('commandPalette:sections.engines'),
      context: 'versions',
      action: () => {
        window.dispatchEvent(new CustomEvent('app:import-version-request'))
      },
    },

    {
      id: 'sync-templates',
      label: t('commandPalette:commands.syncTemplates'),
      icon: <IconRefresh className="w-4 h-4" />,
      section: t('commandPalette:sections.templates'),
      action: () => {
        window.dispatchEvent(new CustomEvent('app:sync-templates-request'))
      },
    },
  ]
}

export interface SettingSearchEntry {
  key: string
  label: string
  tab: string
}

export function buildSettingsSearchItems(t: (key: string) => string): SettingSearchEntry[] {
  const items: SettingSearchEntry[] = [
    { key: 'project_scan_dirs', label: t('commandPalette:settings.projectScanFolders'), tab: 'storage' },
    { key: 'version_scan_dirs', label: t('commandPalette:settings.versionScanFolders'), tab: 'storage' },
    { key: 'default_project_location', label: t('commandPalette:settings.defaultProjectLocation'), tab: 'storage' },
    { key: 'download_dir', label: t('commandPalette:settings.downloadFolder'), tab: 'storage' },
    { key: 'scan_depth', label: t('commandPalette:settings.scanDepth'), tab: 'storage' },
    { key: 'download_concurrency', label: t('commandPalette:settings.simultaneousDownloads'), tab: 'storage' },
    { key: 'close_on_project_open', label: t('commandPalette:settings.closeOnProjectOpen'), tab: 'behavior' },
    { key: 'minimize_to_tray', label: t('commandPalette:settings.minimizeToTray'), tab: 'behavior' },
    { key: 'reopen_after_godot_closes', label: t('commandPalette:settings.reopenAfterGodotCloses'), tab: 'behavior' },
    { key: 'auto_scan_on_startup', label: t('commandPalette:settings.autoScanOnStartup'), tab: 'behavior' },
    { key: 'categories_enabled', label: t('commandPalette:settings.useCategories'), tab: 'behavior' },
    { key: 'workspaces_enabled', label: t('commandPalette:settings.useWorkspaces'), tab: 'behavior' },
    { key: 'tooltip_delay', label: t('commandPalette:settings.tooltipDelay'), tab: 'behavior' },
    { key: 'command_palette_keybind', label: t('commandPalette:settings.commandPaletteKey'), tab: 'behavior' },
    { key: 'tray_recent_projects_count', label: t('commandPalette:settings.trayRecentProjectsCount'), tab: 'behavior' },
    { key: 'last_opened_time_format', label: t('commandPalette:settings.timeFormat'), tab: 'display' },
    { key: 'last_opened_date_format', label: t('commandPalette:settings.dateFormat'), tab: 'display' },
    { key: 'theme_mode', label: t('commandPalette:settings.themeMode'), tab: 'appearance' },
    { key: 'accent_color', label: t('commandPalette:settings.accentColor'), tab: 'appearance' },
    { key: 'background_color', label: t('commandPalette:settings.backgroundColor'), tab: 'appearance' },
    { key: 'corner_radius', label: t('commandPalette:settings.cornerRadius'), tab: 'appearance' },
    { key: 'ui_density', label: t('commandPalette:settings.uiDensity'), tab: 'appearance' },
    { key: 'font_scale', label: t('commandPalette:settings.textSize'), tab: 'appearance' },
    { key: 'reduce_motion', label: t('commandPalette:settings.reduceMotion'), tab: 'appearance' },
    { key: 'feeling_lucky', label: t('commandPalette:settings.feelingLucky'), tab: 'appearance' },
    { key: 'reset_colors', label: t('commandPalette:settings.resetColors'), tab: 'appearance' },
    { key: 'sidebar_width', label: t('commandPalette:settings.sidebarWidth'), tab: 'appearance' },
    { key: 'setup_wizard', label: t('commandPalette:settings.runSetupWizard'), tab: 'advanced' },
    { key: 'reset_settings', label: t('commandPalette:settings.resetSettings'), tab: 'advanced' },
    { key: 'delete_app_data', label: t('commandPalette:settings.deleteAppData'), tab: 'advanced' },
    { key: 'export_settings', label: t('commandPalette:settings.exportSettings'), tab: 'advanced' },
    { key: 'import_settings', label: t('commandPalette:settings.importSettings'), tab: 'advanced' },
    { key: 'check_updates', label: t('commandPalette:settings.checkUpdates'), tab: 'advanced' },
  ]
  return items.filter((item) => !(isMac && item.key === 'minimize_to_tray'))
}

interface Props {
  onClose: () => void
  currentTab: string
  projects?: Project[]
  installedVersions?: InstalledGodotVersion[]
  workspaces?: Workspace[]
  activeWorkspaceId?: string
  paletteKey?: string
}

type ResultItem = CommandItem | DynamicItem

export function CommandPalette({
  onClose,
  currentTab,
  projects = [],
  installedVersions = [],
  workspaces = [],
  activeWorkspaceId = '',
  paletteKey = 'k',
}: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'
  const allCommands = useMemo(() => buildCommands(mod, paletteKey, t), [mod, paletteKey, t])

  const visibleCommands = useMemo(
    () =>
      allCommands.filter(
        (cmd) => !cmd.context || cmd.context === currentTab,
      ),
    [allCommands, currentTab],
  )

  const navShortcuts: Record<string, string> = useMemo(
    () => ({
      projects: `${mod}1`,
      versions: `${mod}2`,
      settings: `${mod},`,
    }),
    [mod],
  )

  const settingsSearchItems = useMemo(() => buildSettingsSearchItems(t), [t])

  const dynamicItems = useMemo(() => {
    const items: DynamicItem[] = []

    const recent = [...projects]
      .filter((p) => p.last_opened)
      .sort(
        (a, b) =>
          new Date(b.last_opened!).getTime() -
          new Date(a.last_opened!).getTime(),
      )
      .slice(0, 5)
    for (const p of recent) {
      items.push({
        id: `recent:${p.id}`,
        label: p.name,
        sublabel: t('commandPalette:dynamic.opened') + ' ' + (formatLastOpened(p.last_opened) || t('commandPalette:dynamic.recently')),
        shortcut: navShortcuts.projects,
        icon: <IconClock className="w-4 h-4" />,
        section: t('commandPalette:sections.recent'),
        action: () => {
          window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 0 }))
          window.dispatchEvent(
            new CustomEvent('app:open-project', { detail: p.id }),
          )
        },
      })
    }

    for (const p of projects) {
      items.push({
        id: `project:${p.id}`,
        label: p.name,
        sublabel: p.path,
        shortcut: navShortcuts.projects,
        icon: <IconNode className="w-4 h-4" />,
        section: t('commandPalette:sections.projects'),
        action: () => {
          window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 0 }))
          window.dispatchEvent(
            new CustomEvent('app:open-project', { detail: p.id }),
          )
        },
      })
    }

    for (const v of installedVersions) {
      items.push({
        id: `version:${v.tag}`,
        label: v.custom_name || v.tag,
        sublabel: v.executable_path,
        shortcut: navShortcuts.versions,
        icon: <IconPlay className="w-4 h-4" />,
        section: t('commandPalette:sections.installedVersions'),
        action: () => {
          window.dispatchEvent(new CustomEvent('app:switch-tab', { detail: 1 }))
        },
      })
    }

    for (const s of settingsSearchItems) {
      const tabLabel = s.tab.charAt(0).toUpperCase() + s.tab.slice(1)
      items.push({
        id: `setting:${s.key}`,
        label: s.label,
        sublabel: t('commandPalette:dynamic.settingsTab', { tab: tabLabel }),
        shortcut: navShortcuts.settings,
        icon: <IconGear className="w-4 h-4" />,
        section: t('commandPalette:sections.settings'),
        action: () => {
          window.dispatchEvent(
            new CustomEvent('app:open-setting', { detail: s.key }),
          )
        },
      })
    }

    for (const w of workspaces) {
      const WsIcon = getWorkspaceIcon(w.icon)
      const active = w.id === activeWorkspaceId
      items.push({
        id: `workspace:${w.id}`,
        label: active ? `${w.name} (${t('commandPalette:dynamic.active')})` : w.name,
        sublabel: active ? t('commandPalette:dynamic.currentWorkspace') : t('commandPalette:dynamic.switchWorkspace'),
        icon: (
          <WsIcon
            className="w-4 h-4"
            style={{ color: w.color }}
          />
        ),
        section: t('commandPalette:sections.workspaces'),
        action: () => {
          window.dispatchEvent(
            new CustomEvent('app:switch-workspace', { detail: w.id }),
          )
        },
      })
    }

    return items
  }, [projects, installedVersions, workspaces, activeWorkspaceId, t, navShortcuts, settingsSearchItems])

  const allItems = useMemo(
    () => [...visibleCommands, ...dynamicItems],
    [visibleCommands, dynamicItems],
  )

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase()
    const results = q
      ? allItems.filter((item) => {
          const label = 'label' in item ? item.label.toLowerCase() : ''
          const sublabel = 'sublabel' in item
            ? (item as DynamicItem).sublabel.toLowerCase()
            : ''
          const section = item.section.toLowerCase()
          return (
            label.includes(q) ||
            sublabel.includes(q) ||
            section.includes(q)
          )
        })
      : allItems

    const sections = new Map<string, ResultItem[]>()
    for (const item of results) {
      if (!sections.has(item.section)) sections.set(item.section, [])
      sections.get(item.section)!.push(item)
    }
    return [...sections.entries()]
  }, [query, allItems])

  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredSections])

  const flatList = useMemo(
    () => filteredSections.flatMap(([, items]) => items),
    [filteredSections],
  )

  const executeSelected = useCallback(() => {
    const item = flatList[selectedIndex]
    if (item) {
      item.action()
      onClose()
    }
  }, [flatList, selectedIndex, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        executeSelected()
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    if (item) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  let itemIndex = 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-100 flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative w-full max-w-lg bg-surface border border-line rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <IconSearch
            fill="none"
            className="w-4 h-4 shrink-0 text-muted/60"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette:searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/50"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-raised border border-line text-muted/60 shrink-0">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {flatList.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted">
                {t('commandPalette:noResults')}{' '}
                <span className="font-mono text-ink">"{query}"</span>
              </p>
            </div>
          ) : (
            filteredSections.map(([section, items]) => (
              <div key={section}>
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted/50">
                  {section}
                </div>
                {items.map((item) => {
                  const idx = itemIndex++
                  const selected = selectedIndex === idx
                  const isDynamic = 'sublabel' in item
                  const shortcut =
                    'shortcut' in item ? item.shortcut : undefined
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => {
                        item.action()
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`focus-ring cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        selected
                          ? 'bg-accent/15 text-ink'
                          : 'text-muted hover:text-ink hover:bg-raised'
                      }`}
                    >
                      <span
                        className={`shrink-0 ${selected ? 'text-accent-bright' : 'text-muted/70'}`}
                      >
                        {item.icon}
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {isDynamic && (
                          <span className="block text-[10px] text-muted/50 truncate">
                            {(item as DynamicItem).sublabel}
                          </span>
                        )}
                      </div>
                      {shortcut && (
                        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-raised border border-line text-muted/50 shrink-0">
                          {shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-line flex items-center gap-4 text-[10px] text-muted/50">
          <span>
            <kbd className="font-mono px-1 bg-raised rounded border border-line">↑↓</kbd>{' '}
            {t('commandPalette:footer.navigate')}
          </span>
          <span>
            <kbd className="font-mono px-1 bg-raised rounded border border-line">↵</kbd>{' '}
            {t('commandPalette:footer.select')}
          </span>
          <span>
            <kbd className="font-mono px-1 bg-raised rounded border border-line">Esc</kbd>{' '}
            {t('commandPalette:footer.close')}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
