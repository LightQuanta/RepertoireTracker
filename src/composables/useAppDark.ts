import { useDark, useToggle } from '@vueuse/core'

export function useAppDark() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  async function toggleDarkWithTransition() {
    if (!document.startViewTransition) {
      toggleDark()
      return
    }

    // 临时禁用默认动画
    document.documentElement.classList.add('darkModeSwitchAnimation')

    const diagonal = Math.hypot(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    )

    const transition = document.startViewTransition(toggleDark)
    await transition.ready

    document.documentElement.animate([
      { clipPath: 'circle(0 at 100% 0)' },
      { clipPath: `circle(${diagonal}px at 100% 0)` },
    ], {
      duration: 500,
      easing: 'ease-out',
      pseudoElement: '::view-transition-new(root)',
    })

    await transition.finished
    document.documentElement.classList.remove('darkModeSwitchAnimation')
  }

  return {
    isDark,
    toggleDark,
    toggleDarkWithTransition,
  }
}
