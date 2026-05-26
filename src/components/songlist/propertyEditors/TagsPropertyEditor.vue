<script setup lang="ts">
import type { SongProperty } from '@/config/song'
import { ElInputTag } from 'element-plus'
import { getPropertySchema } from '@/config/song'

const props = defineProps<{
  property: SongProperty
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const tags = computed({
  get: () => {
    const result = getPropertySchema(props.property).safeParse(props.modelValue)
    if (!result.success) {
      console.warn(`[TagsPropertyEditor] 属性 "${props.property.displayName}" 的值解析失败`, result.error.issues)
      return []
    }
    return Array.isArray(result.data) ? [...result.data] : []
  },
  set: (val) => {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <ElInputTag v-model="tags" :placeholder="`输入${property.displayName}后按回车添加`" clearable draggable :maxlength="30" />
</template>
