<script setup lang="ts">
import type { PropertyType } from '@schema/song'
import { getPropertySchema } from '@schema/song'
import { ElTag } from 'element-plus'
import { computed } from 'vue'

const props = defineProps<{
  value: any
  property: PropertyType
}>()

const displayTags = computed(() => {
  const parsed = getPropertySchema(props.property).parse(props.value)
  return Array.isArray(parsed) ? (parsed as string[]) : []
})
</script>

<template>
  <div class="flex max-w-full items-center gap-1.5 overflow-hidden">
    <ElTag v-for="tag in displayTags" :key="tag" size="small" effect="plain" :disable-transitions="true">
      {{ tag }}
    </ElTag>
    <span v-if="displayTags.length === 0" class="text-#98a2b3">
      -
    </span>
  </div>
</template>
