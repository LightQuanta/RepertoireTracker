<script setup lang="ts">
import type { SongProperty } from '@/config/song'
import { ElSwitch } from 'element-plus'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  value: any
  property: SongProperty
}>()

const checked = computed(() => {
  const result = getPropertySchema(props.property).safeParse(props.value)
  if (!result.success) {
    console.warn(`[BooleanProperty] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
    return false
  }
  const parsed = result.data
  if (parsed == null)
    return false
  return result.data
})
</script>

<template>
  <ElSwitch v-model="checked" disabled />
</template>
