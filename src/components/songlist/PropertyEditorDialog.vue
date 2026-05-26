<script setup lang="ts">
import type { SongInfo, SongProperty } from '@/config/song'
import { ElButton, ElDialog, ElText } from 'element-plus'
import PropertyEditorComponent from './PropertyEditorComponent.vue'

const props = defineProps<{
  visible: boolean
  song: SongInfo | null
  properties: SongProperty[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save': [songData: Record<string, any>]
}>()

const editingProperties = ref<Record<string, any>>({})

watch(() => props.visible, (val) => {
  if (val && props.song) {
    editingProperties.value = { ...props.song.properties }
  }
})

function handleClose() {
  emit('update:visible', false)
}

function handleSave() {
  emit('save', editingProperties.value)
  handleClose()
}
</script>

<template>
  <ElDialog :model-value="visible" width="560px" align-center @update:model-value="emit('update:visible', $event)">
    <template #header>
      <ElText class="text-18px font-600" size="large">
        编辑歌曲属性
      </ElText>
      <br>
      <ElText size="small" class="text-2.5" :type="song ? 'info' : 'danger'">
        {{ song?.id ?? 'ERROR' }}
      </ElText>
    </template>

    <div class="space-y-5 py-2">
      <div v-for="property in properties" :key="property.id" class="flex items-start justify-center gap-4">
        <ElText class="w-24 shrink-0 text-14px text-#344054 font-500 text-right leading-8">
          {{ property.displayName }}
        </ElText>
        <div class="flex-1">
          <PropertyEditorComponent
            :property="property"
            :model-value="editingProperties[property.id] ?? property.default"
            @update:model-value="editingProperties[property.id] = $event"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="handleClose">
          取消
        </ElButton>
        <ElButton type="primary" @click="handleSave">
          保存
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
