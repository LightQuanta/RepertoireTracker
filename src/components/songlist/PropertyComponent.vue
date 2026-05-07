<script setup lang="ts">
import { z } from 'astro/zod'
import { songSchema } from '@schema/song'

type SongList = z.infer<typeof songSchema>
type SongProperty = SongList['properties'][number]

// TODO 解决加载时页面抖动的问题
const componentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  string: defineAsyncComponent(() => import('./propertyComponents/StringProperty.vue')),
  integer: defineAsyncComponent(() => import('./propertyComponents/NumberProperty.vue')),
  float: defineAsyncComponent(() => import('./propertyComponents/NumberProperty.vue')),
  boolean: defineAsyncComponent(() => import('./propertyComponents/BooleanProperty.vue')),
  tags: defineAsyncComponent(() => import('./propertyComponents/TagsProperty.vue')),
  date: defineAsyncComponent(() => import('./propertyComponents/DateProperty.vue')),
}

defineProps<{
  property: SongProperty
  value: any
}>()
</script>

<template>
  <component
    :is="componentMap[property.type]"
    :value="value"
    :property="property"
  />
</template>
