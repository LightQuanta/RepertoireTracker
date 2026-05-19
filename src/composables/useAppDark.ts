import { useDark, useToggle } from '@vueuse/core'

export function useAppDark() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  function toggleDarkWithTransition() {
    if (!document.startViewTransition) {
      toggleDark()
      return
    }

    const diagonal = Math.hypot(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    )

    document.documentElement.style.setProperty('--radius-end', `${diagonal}px`)
    document.startViewTransition(toggleDark)
  }

  return {
    isDark,
    toggleDark,
    toggleDarkWithTransition,
  }
}
