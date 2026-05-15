<script setup lang="ts">
import type { PropertyType } from '@schema/song'
import { ElDatePicker } from 'element-plus'

const props = defineProps<{
  property: PropertyType
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const dateValue = computed({
  get: () => {
    if (!props.modelValue)
      return null
    const date = props.modelValue instanceof Date ? props.modelValue : new Date(props.modelValue as string)
    return Number.isNaN(date.getTime()) ? null : date
  },
  set: (val: Date | null) => {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <ElDatePicker v-model="dateValue" type="date" placeholder="选择日期" class="w-full" clearable />
</template>
