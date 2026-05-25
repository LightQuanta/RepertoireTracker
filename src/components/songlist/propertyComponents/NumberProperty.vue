<script setup lang="ts">
import type { PropertyType } from '@/config/song'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  value: any
  property: PropertyType
}>()

const displayText = computed(() => {
  const result = getPropertySchema(props.property).safeParse(props.value)
  if (!result.success) {
    console.warn(`[NumberProperty] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
    return '-'
  }
  const parsed = result.data
  if (parsed == null)
    return '-'
  return String(parsed)
})
</script>

<template>
  <ElText class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
    {{ displayText }}
  </ElText>
</template>
