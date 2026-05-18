<script setup lang="ts">
import type { PropertyKeys, PropertyType } from '@schema/song'
import type { Component } from 'vue'

import BooleanPropertyEditor from './propertyEditors/BooleanPropertyEditor.vue'
import DatePropertyEditor from './propertyEditors/DatePropertyEditor.vue'
import NumberPropertyEditor from './propertyEditors/NumberPropertyEditor.vue'
import StringPropertyEditor from './propertyEditors/StringPropertyEditor.vue'
import TagsPropertyEditor from './propertyEditors/TagsPropertyEditor.vue'

defineProps<{
  property: PropertyType
  modelValue: any
}>()

defineEmits<{
  'update:modelValue': [value: any]
}>()

const componentMap: Record<PropertyKeys, Component> = {
  string: StringPropertyEditor,
  integer: NumberPropertyEditor,
  float: NumberPropertyEditor,
  boolean: BooleanPropertyEditor,
  tags: TagsPropertyEditor,
  date: DatePropertyEditor,
}
</script>

<template>
  <component
    :is="componentMap[property.type]" :property="property" :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
