import { useDark, useToggle } from '@vueuse/core'

export function useAppDark() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  return {
    isDark,
    toggleDark,
  }
}
