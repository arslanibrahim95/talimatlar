import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
}

interface ThemeActions {
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

type ThemeStore = ThemeState & ThemeActions

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      theme: 'system',

      // Actions
      setTheme: (theme: Theme) => {
        set({ theme })
        applyTheme(theme)
      },

      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme })
        applyTheme(newTheme)
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Apply theme to document
function applyTheme(theme: Theme) {
  const root = document.documentElement

  // Remove existing theme classes
  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}
