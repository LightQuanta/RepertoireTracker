<script setup lang="ts">
import 'element-plus/dist/index.css'

import type { z } from 'astro/zod'
import { getPropertySchema, songSchema } from '@schema/song'
import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'

type SongList = z.infer<typeof songSchema>
type Song = SongList['songs'][number]
type SongProperty = SongList['properties'][number]
type PropertyType = SongProperty['type']
type EditableValue = string | number | boolean | string[] | Date | undefined

const SAVE_DELAY = 1000
const sourceUrl = import.meta.env.SSR
  ? 'http://localhost:4321/data/songlist.json'
  : '/data/songlist.json'

const songlist = ref(songSchema.parse(await fetch(sourceUrl).then(res => res.json())))
const editingSongIds = ref(new Set<string>())

let saveTimer: ReturnType<typeof setTimeout> | undefined
let hasPendingSave = false
let isSaving = false

const displayProperties = computed(() => songlist.value.properties.filter(property => property.show ?? true))

function isEditing(song: Song) {
  return editingSongIds.value.has(song.id)
}

function shouldShowEditor(song: Song, property: SongProperty) {
  return property.type === 'boolean' || isEditing(song)
}

function toggleEditing(song: Song) {
  const nextIds = new Set(editingSongIds.value)
  const isCurrentlyEditing = nextIds.has(song.id)

  isCurrentlyEditing ? nextIds.delete(song.id) : nextIds.add(song.id)
  editingSongIds.value = nextIds

  if (isCurrentlyEditing) {
    requestSave()
  }
}

function rawValue(song: Song, property: SongProperty) {
  return song.properties[property.id] ?? property.default
}

function editorValue(song: Song, property: SongProperty) {
  const value = rawValue(song, property)

  switch (property.type) {
    case 'tags':
      return Array.isArray(value) ? value : []
    case 'date':
      return value instanceof Date ? value : undefined
    case 'integer':
    case 'float':
      return typeof value === 'number' ? value : undefined
    case 'string':
      return typeof value === 'string' ? value : ''
    case 'boolean':
      return Boolean(value)
  }
}

function updateValue(song: Song, property: SongProperty, value: EditableValue) {
  song.properties[property.id] = normalizeValue(property, value)
  requestSave()
}

function normalizeValue(property: SongProperty, value: EditableValue) {
  if ((value === '' || value == null) && (property.optional ?? false)) {
    return undefined
  }

  if (property.type === 'integer' && typeof value === 'number') {
    return Math.trunc(value)
  }

  if (property.type === 'date') {
    return value ? new Date(value as Date | string) : undefined
  }

  return value
}

function displayValue(song: Song, property: SongProperty) {
  const value = rawValue(song, property)

  if (value == null || value === '') {
    return '-'
  }

  if (property.type === 'tags') {
    return Array.isArray(value) ? value : []
  }

  if (property.type === 'date') {
    const date = value instanceof Date ? value : new Date(value as string)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
  }

  return String(getPropertySchema(property).parse(value))
}

function numberStep(type: PropertyType) {
  return type === 'integer' ? 1 : 0.1
}

async function handleSonglistSaved(nextSonglist: SongList) {
  // 在这里接入真实保存后的业务回调，例如提示、同步外部状态或调用接口。
  console.log('songlist saved', nextSonglist)
}

async function saveNow() {
  await handleSonglistSaved(songSchema.parse(songlist.value))
}

function requestSave() {
  hasPendingSave = true

  if (!saveTimer && !isSaving) {
    saveTimer = setTimeout(flushSave, SAVE_DELAY)
  }
}

async function flushSave() {
  saveTimer = undefined

  if (!hasPendingSave) {
    return
  }

  hasPendingSave = false
  isSaving = true

  try {
    await saveNow()
  }
  finally {
    isSaving = false

    if (hasPendingSave) {
      requestSave()
    }
  }
}

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }

  if (hasPendingSave) {
    void flushSave()
  }
})
</script>

<template>
<section class="box-border min-h-full w-full border-box bg-#f6f8fb p-5 max-md:p-3">
  <header class="mb-3.5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
    <div>
      <h1 class="mb-4 text-22px text-#1f2937 font-650 leading-1.25 mb-4">
        歌单编辑
      </h1>
      <p class="mt-1.5 text-13px text-#667085">
        {{ songlist.songs.length }} 首歌曲 · {{ displayProperties.length }} 个展示字段
      </p>
    </div>
  </header>

  <el-table :data="songlist.songs" border row-key="id"
    class="song-list-table w-full overflow-hidden rounded-8px shadow-[0_10px_28px_rgb(31_41_55_/_8%)]"
    :row-class-name="({ row }) => isEditing(row) ? 'is-editing-row' : ''">
    <el-table-column v-for="property in displayProperties" :key="property.id" :label="property.displayName"
      min-width="190" show-overflow-tooltip>
      <template #default="{ row }">
        <div class="flex min-h-34px items-center" :class="shouldShowEditor(row, property) ? 'min-h-38px' : ''">
          <template v-if="shouldShowEditor(row, property)">
            <el-switch v-if="property.type === 'boolean'" :model-value="editorValue(row, property) as boolean"
              inline-prompt active-text="是" inactive-text="否"
              @update:model-value="value => updateValue(row, property, value)" />

            <el-select v-else-if="property.type === 'tags'" :model-value="editorValue(row, property) as string[]"
              multiple filterable allow-create default-first-option collapse-tags collapse-tags-tooltip class="w-full"
              placeholder="输入后回车添加" @update:model-value="value => updateValue(row, property, value)" />

            <el-date-picker v-else-if="property.type === 'date'"
              :model-value="editorValue(row, property) as Date | undefined" type="date" value-format="YYYY-MM-DD"
              class="w-full" placeholder="选择日期" @update:model-value="value => updateValue(row, property, value)" />

            <el-input-number v-else-if="property.type === 'integer' || property.type === 'float'"
              :model-value="editorValue(row, property) as number | undefined"
              :precision="property.type === 'integer' ? 0 : undefined" :step="numberStep(property.type)"
              controls-position="right" class="w-150px"
              @update:model-value="value => updateValue(row, property, value ?? undefined)" />

            <el-input v-else :model-value="editorValue(row, property) as string" clearable class="w-full"
              placeholder="请输入" @update:model-value="value => updateValue(row, property, value)" />
          </template>

          <template v-else-if="property.type === 'tags' && Array.isArray(displayValue(row, property))">
            <div class="song-list-tags flex max-w-full items-center gap-1.5 overflow-hidden">
              <el-tag v-for="tag in displayValue(row, property) as string[]" :key="tag" size="small" effect="plain">
                {{ tag }}
              </el-tag>
              <span v-if="(displayValue(row, property) as string[]).length === 0" class="text-#98a2b3">
                -
              </span>
            </div>
          </template>

          <template v-else>
            <span class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-#1f2937">
              {{ displayValue(row, property) }}
            </span>
          </template>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="132" fixed="right" align="center">
      <template #default="{ row }">
        <el-button size="small" :type="isEditing(row) ? 'success' : 'primary'" :plain="!isEditing(row)" class="w-76px"
          @click="toggleEditing(row)">
          {{ isEditing(row) ? '完成修改' : '编辑' }}
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</section>
</template>

<style scoped>
.song-list-table :deep(.el-table__header th) {
  height: 44px;
  background: #f9fafb;
  color: #344054;
  font-weight: 650;
}

.song-list-table :deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

.song-list-table :deep(.el-table__row.is-editing-row) {
  background: #fbfdff;
}

.song-list-table :deep(.el-table__cell) {
  padding: 9px 0;
}

.song-list-tags :deep(.el-tag) {
  max-width: 92px;
}

.song-list-tags :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
