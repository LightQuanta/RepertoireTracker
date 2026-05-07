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
  <div class="song-list-tags flex max-w-full items-center gap-1.5 overflow-hidden">
    <el-tag v-for="tag in displayTags" :key="tag" size="small" effect="plain">
      {{ tag }}
    </el-tag>
    <span v-if="displayTags.length === 0" class="text-#98a2b3">
      -
    </span>
  </div>
</template>

<style scoped>
.song-list-tags :deep(.el-tag) {
  max-width: 92px;
}

.song-list-tags :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
