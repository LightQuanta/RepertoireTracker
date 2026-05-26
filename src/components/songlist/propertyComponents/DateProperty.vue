<script setup lang="ts">
import type { SongProperty } from '@/config/song'
import { ElText } from 'element-plus'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  value: any
  property: SongProperty
}>()

const displayText = computed(() => {
  const result = getPropertySchema(props.property).safeParse(props.value)
  if (!result.success) {
    console.warn(`[DateProperty] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
    return '-'
  }
  const parsed = result.data
  if (parsed == null)
    return '-'
  const date = parsed instanceof Date ? parsed : new Date(parsed as string)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
})
</script>

<template>
  <ElText class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
    {{ displayText }}
  </ElText>
</template>
