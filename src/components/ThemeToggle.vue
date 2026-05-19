<script setup lang="ts">
import { ElButton, ElTooltip } from 'element-plus'
import { useAppDark } from '@/composables/useAppDark'

const { isDark, toggleDarkWithTransition } = useAppDark()
</script>

<template>
  <ElTooltip :content="isDark ? '切换亮色模式' : '切换暗色模式'" placement="bottom">
    <ElButton
      size="small"
      circle
      @click="toggleDarkWithTransition"
    >
      <span class="text-16px leading-none">{{ isDark ? '🌙' : '☀️' }}</span>
    </ElButton>
  </ElTooltip>
</template>
