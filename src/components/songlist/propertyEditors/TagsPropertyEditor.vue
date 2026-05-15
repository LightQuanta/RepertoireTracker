<script setup lang="ts">
import type { PropertyType } from '@schema/song'
import { ElInputTag } from 'element-plus'

const props = defineProps<{
  property: PropertyType
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const tags = computed({
  get: () => Array.isArray(props.modelValue) ? [...props.modelValue] : [],
  set: (val) => {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <ElInputTag v-model="tags" :placeholder="`输入${property.displayName}后按回车添加`" clearable draggable :maxlength="30" />
</template>
