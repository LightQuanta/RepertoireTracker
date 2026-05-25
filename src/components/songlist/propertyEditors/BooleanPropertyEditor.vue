<script setup lang="ts">
import type { PropertyType } from '@/config/song'
import { ElCheckbox } from 'element-plus'

const props = defineProps<{
  property: PropertyType
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const checked = computed({
  get: () => !!props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <ElCheckbox v-model="checked" :label="property.displayName" />
</template>
