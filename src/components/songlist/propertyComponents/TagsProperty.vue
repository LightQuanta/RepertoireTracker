<script setup lang="ts">
import { computed } from 'vue'
import { ElTag } from 'element-plus'
import { getPropertySchema, type PropertyType } from '@schema/song'

const props = defineProps<{
  value: any
  property: PropertyType
}>()

const displayTags = computed(() => {
  const parsed = getPropertySchema(props.property).parse(props.value)
  return Array.isArray(parsed) ? (parsed as string[]) : []
})
</script>

<template>
  <div class="flex max-w-full items-center gap-1.5 overflow-hidden">
    <el-tag v-for="tag in displayTags" size="small" effect="plain" :disable-transitions="true">
      {{ tag }}
    </el-tag>
    <span v-if="displayTags.length === 0" class="text-#98a2b3">
      -
    </span>
  </div>
</template>
