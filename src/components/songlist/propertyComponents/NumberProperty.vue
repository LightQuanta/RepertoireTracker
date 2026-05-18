<script setup lang="ts">
import type { PropertyType } from '@schema/song'
import { getPropertySchema } from '@schema/song'

const props = defineProps<{
  value: any
  property: PropertyType
}>()

const displayText = computed(() => {
  const parsed = getPropertySchema(props.property).parse(props.value)
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
