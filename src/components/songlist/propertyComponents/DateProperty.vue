<script setup lang="ts">
import type { PropertyType } from '@/config/song'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  value: any
  property: PropertyType
}>()

const displayText = computed(() => {
  const parsed = getPropertySchema(props.property).parse(props.value)
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
