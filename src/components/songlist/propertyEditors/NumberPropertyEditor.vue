<script setup lang="ts">
import type { SongProperty } from '@/config/song'
import { ElInputNumber } from 'element-plus'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  property: SongProperty
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const isInteger = computed(() => props.property.type === 'integer')

const inputValue = computed({
  get: () => {
    const result = getPropertySchema(props.property).safeParse(props.modelValue)
    if (!result.success) {
      console.warn(`[NumberPropertyEditor] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
      return 0
    }
    return result.data ?? 0
  },
  set: (val: number | undefined | null) => {
    if (val == null || Number.isNaN(val)) {
      emit('update:modelValue', isInteger.value ? 0 : 0)
    }
    else {
      emit('update:modelValue', isInteger.value ? Math.round(val) : val)
    }
  },
})
</script>

<template>
  <ElInputNumber
    v-model="inputValue" controls-position="right" :precision="isInteger ? 0 : 2" :step="isInteger ? 1 : 0.1"
    :placeholder="`请输入${property.displayName}`" class="w-full"
  />
</template>
