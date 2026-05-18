import { useDark, useToggle } from '@vueuse/core'

export function useAppDark() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  function toggleDarkWithTransition(x: number, y: number) {
    if (!document.startViewTransition) {
      toggleDark()
      return
    }

    const diagonal = Math.hypot(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    )

    const root = document.documentElement
    root.style.setProperty('--x', `${x}px`)
    root.style.setProperty('--y', `${y}px`)
    root.style.setProperty('--radius-end', `${diagonal}px`)

    document.startViewTransition(toggleDark)
  }

  return {
    isDark,
    toggleDark,
    toggleDarkWithTransition,
  }
}
