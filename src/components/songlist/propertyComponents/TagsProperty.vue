<script setup lang="ts">
import type { SongProperty } from '@/config/song'
import { ElTag, ElText } from 'element-plus'
import { computed } from 'vue'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  value: any
  property: SongProperty
}>()

const displayTags = computed(() => {
  const result = getPropertySchema(props.property).safeParse(props.value)
  if (!result.success) {
    console.warn(`[TagsProperty] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
    return []
  }
  const parsed = result.data
  return Array.isArray(parsed) ? (parsed as string[]) : []
})
</script>

<template>
  <div class="flex max-w-full items-center gap-1.5 overflow-hidden">
    <ElTag v-for="tag in displayTags" :key="tag" size="small" effect="plain" :disable-transitions="true">
      {{ tag }}
    </ElTag>
    <ElText v-if="displayTags.length === 0">
      -
    </ElText>
  </div>
</template>
