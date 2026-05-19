import { useDark, useToggle } from '@vueuse/core'

export function useAppDark() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  async function toggleDarkWithTransition() {
    if (!document.startViewTransition) {
      toggleDark()
      return
    }

    const diagonal = Math.hypot(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    )

    // 临时禁用默认动画
    const disableDefaultTransitionStyle = document.createElement('style')
    disableDefaultTransitionStyle.textContent = `
      ::view-transition-old(root), ::view-transition-new(root) {
        animation: none !important;
      }`
    document.head.appendChild(disableDefaultTransitionStyle)

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
    disableDefaultTransitionStyle.remove()
  }

  return {
    isDark,
    toggleDark,
    toggleDarkWithTransition,
  }
}
