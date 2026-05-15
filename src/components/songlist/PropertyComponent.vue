<script setup lang="ts">
import type { songSchema } from '@schema/song'
import type { z } from 'astro/zod'
import type { Component } from 'vue'

import BooleanProperty from './propertyComponents/BooleanProperty.vue'
import DateProperty from './propertyComponents/DateProperty.vue'
import NumberProperty from './propertyComponents/NumberProperty.vue'
import StringProperty from './propertyComponents/StringProperty.vue'
import TagsProperty from './propertyComponents/TagsProperty.vue'

type SongList = z.infer<typeof songSchema>
type SongProperty = SongList['properties'][number]

defineProps<{
  property: SongProperty
  value: any
}>()

const componentMap: Record<string, Component> = {
  string: StringProperty,
  integer: NumberProperty,
  float: NumberProperty,
  boolean: BooleanProperty,
  tags: TagsProperty,
  date: DateProperty,
}
</script>

<template>
  <component
    :is="componentMap[property.type]"
    :value="value"
    :property="property"
  />
</template>
