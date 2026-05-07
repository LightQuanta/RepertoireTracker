<script setup lang="ts">
import { getPropertySchema, type PropertyType } from '@schema/song'

const props = defineProps<{
  value: any
  property: PropertyType
}>()

const displayText = computed(() => {
  const parsed = getPropertySchema(props.property).parse(props.value)
  if (parsed == null || parsed === '') return '-'
  return String(parsed)
})
</script>

<template>
  <span class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-#1f2937">
    {{ displayText }}
  </span>
</template>
