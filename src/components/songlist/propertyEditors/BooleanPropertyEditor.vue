<script setup lang="ts">
import type { PropertyType } from '@/config/song'
import { ElCheckbox } from 'element-plus'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  property: PropertyType
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const checked = computed({
  get: () => {
    const result = getPropertySchema(props.property).safeParse(props.modelValue)
    if (!result.success) {
      console.warn(`[BooleanPropertyEditor] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
      return false
    }
    return result.data ?? false
  },
  set: (val) => {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <ElCheckbox v-model="checked" :label="property.displayName" />
</template>
