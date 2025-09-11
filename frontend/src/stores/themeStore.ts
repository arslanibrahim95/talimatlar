import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  isDark: boolean
}

interface ThemeActions {
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  getSystemTheme: () => 'light' | 'dark'
}

type ThemeStore = ThemeState & ThemeActions

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      theme: 'system',
      isDark: false,

      // Actions
      setTheme: (theme: Theme) => {
        const isDark = theme === 'dark' || (theme === 'system' && get().getSystemTheme() === 'dark')
        set({ theme, isDark })
        applyTheme(theme)
      },

      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'
        const isDark = newTheme === 'dark'
        set({ theme: newTheme, isDark })
        applyTheme(newTheme)
      },

      getSystemTheme: () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Apply theme to document with improved handling
function applyTheme(theme: Theme) {
  const root = document.documentElement
  const body = document.body

  // Remove existing theme classes
  root.classList.remove('light', 'dark')
  body.classList.remove('light', 'dark')

  let actualTheme: 'light' | 'dark'

  if (theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    actualTheme = theme
  }

  // Apply theme classes
  root.classList.add(actualTheme)
  body.classList.add(actualTheme)

  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(actualTheme)

  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: actualTheme } }))
}

// Update meta theme-color for better mobile experience
function updateMetaThemeColor(theme: 'light' | 'dark') {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]')
  
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta')
    metaThemeColor.setAttribute('name', 'theme-color')
    document.head.appendChild(metaThemeColor)
  }

  if (theme === 'dark') {
    metaThemeColor.setAttribute('content', '#0f172a') // slate-900
  } else {
    metaThemeColor.setAttribute('content', '#ffffff') // white
  }
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  mediaQuery.addEventListener('change', (e) => {
    const { theme } = useTheme.getState()
    if (theme === 'system') {
      applyTheme('system')
    }
  })

  // Initialize theme on mount
  const { theme } = useTheme.getState()
  if (theme) {
    applyTheme(theme)
  }
}
