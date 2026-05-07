<script setup lang="ts">
import { z } from 'astro/zod'
import { songSchema } from '@schema/song'
import type { Component } from 'vue'

import StringProperty from './propertyComponents/StringProperty.vue'
import NumberProperty from './propertyComponents/NumberProperty.vue'
import BooleanProperty from './propertyComponents/BooleanProperty.vue'
import TagsProperty from './propertyComponents/TagsProperty.vue'
import DateProperty from './propertyComponents/DateProperty.vue'

type SongList = z.infer<typeof songSchema>
type SongProperty = SongList['properties'][number]

const componentMap: Record<string, Component> = {
  string: StringProperty,
  integer: NumberProperty,
  float: NumberProperty,
  boolean: BooleanProperty,
  tags: TagsProperty,
  date: DateProperty,
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
