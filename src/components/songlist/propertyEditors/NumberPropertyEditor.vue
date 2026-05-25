<script setup lang="ts">
import type { PropertyType } from '@/config/song'
import { ElInputNumber } from 'element-plus'

const props = defineProps<{
  property: PropertyType
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const isInteger = computed(() => props.property.type === 'integer')

const inputValue = computed({
  get: () => props.modelValue ?? (isInteger.value ? 0 : 0),
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
