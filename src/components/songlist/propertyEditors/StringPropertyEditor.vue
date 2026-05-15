<script setup lang="ts">
import type { PropertyType } from '@schema/song'
import { ElInput } from 'element-plus'

const props = defineProps<{
  property: PropertyType
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const inputValue = computed({
  get: () => props.modelValue ?? '',
  set: (val) => {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <ElInput v-model="inputValue" :placeholder="`请输入${property.displayName}`" clearable maxlength="200" show-word-limit />
</template>
