<script setup lang="ts">
import type { SongProperty } from '@/config/song'
import { ElDatePicker } from 'element-plus'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  property: SongProperty
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const dateValue = computed({
  get: () => {
    const result = getPropertySchema(props.property).safeParse(props.modelValue)
    if (!result.success) {
      console.warn(`[DatePropertyEditor] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
      return null
    }
    if (!result.data)
      return null
    const date = result.data instanceof Date ? result.data : new Date(result.data as string)
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
