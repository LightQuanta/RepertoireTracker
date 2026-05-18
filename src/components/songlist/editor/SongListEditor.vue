<script setup lang="ts">
import type { PropertyType } from '@schema/song'
import type { UseFuseOptions } from '@vueuse/integrations/useFuse'
import type { z } from 'astro/zod'
import PropertyComponent from '@components/songlist/PropertyComponent.vue'
import PropertyEditorDialog from '@components/songlist/PropertyEditorDialog.vue'
import PropertySchemaEditorDialog from '@components/songlist/PropertySchemaEditorDialog.vue'
import { songSchema } from '@schema/song'

import { onKeyStroke, onStartTyping, refDebounced, useUrlSearchParams } from '@vueuse/core'
import { useFuse } from '@vueuse/integrations/useFuse'
import {
  ElButton,
  ElInput,
  ElPagination,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTooltip,
} from 'element-plus'
import 'element-plus/dist/index.css'

type SongList = z.infer<typeof songSchema>

const sourceUrl = import.meta.env.SSR
  ? 'http://localhost:4321/data/songlist.json'
  : '/data/songlist.json'

// TODO 性能优化？
const songlist = ref(songSchema.parse(await fetch(sourceUrl).then(res => res.json())))
const displayProperties = computed(() => songlist.value.properties.filter(property => property.show ?? true))

// 搜索处理
const searchInput = useTemplateRef('searchInput')

function focusSearchInput() {
  searchInput.value?.focus()
}

// 英文数字输入
onStartTyping(focusSearchInput)

// Ctrl + K / F
onKeyStroke(['k', 'f'], (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    focusSearchInput()
  }
})

// 空格, /, Enter, Backspace
onKeyStroke([' ', '/', 'Enter', 'Backspace'], (e) => {
  if (!isFocusedElementEditable()) {
    e.preventDefault()
    focusSearchInput()
  }
})

// Ctrl + A
onKeyStroke('a', (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    focusSearchInput()
    searchInput.value?.select()
  }
})

// https://github.com/vueuse/vueuse/blob/99c5df9a1017733046b496a6bb585d9fed7fbe8f/packages/core/onStartTyping/index.ts#L6-L26
// Copyright (c) 2019-PRESENT Anthony Fu<https://github.com/antfu>
// Licensed under the MIT License.
function isFocusedElementEditable() {
  const { activeElement, body } = document

  if (!activeElement)
    return false

  // If not element has focus, we assume it is not editable, too.
  if (activeElement === body)
    return false

  // Assume <input> and <textarea> elements are editable.
  switch (activeElement.tagName) {
    case 'INPUT':
    case 'TEXTAREA':
      return true
  }

  // Check if any other focused element id editable.
  return activeElement.hasAttribute('contenteditable')
}

const inputText = ref('')
const debouncedSearchText = refDebounced(inputText, 200)

const songs = computed(() => songlist.value?.songs ?? [])

const fuseOptions = computed(() => ({
  fuseOptions: {
    keys: songlist.value.properties
      .filter(property => property.searchWeight > 0)
      .map(property => ({
        name: `properties.${property.id}`,
        weight: property.searchWeight,
      })),
    isCaseSensitive: false,
    threshold: 0.9,
  },
  matchAllWhenSearchEmpty: true,
} as UseFuseOptions<SongList['songs'][0]>))

const fuse = useFuse(debouncedSearchText, songs, fuseOptions)

const searchMethod = ref<'fuse' | 'contains'>('fuse')
const searchDuration = ref(0)
const searchPerformed = ref(false)

const containsFilteredSongs = computed(() => {
  const text = debouncedSearchText.value.trim()

  if (!text) {
    return songs.value
  }

  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean)
  const searchablePropertyIds = songlist.value.properties
    .filter(p => p.searchWeight > 0)
    .map(p => p.id)

  return songs.value.filter(song =>
    tokens.some(token =>
      searchablePropertyIds.some((id) => {
        const value = song.properties[id]
        return value != null && String(value).toLowerCase().includes(token)
      }),
    ),
  )
})

const filteredSongs = ref(songs.value)

watch([debouncedSearchText, searchMethod, songs], () => {
  const text = debouncedSearchText.value.trim()

  if (!text) {
    filteredSongs.value = songs.value
    searchDuration.value = 0
    searchPerformed.value = false
    return
  }

  searchPerformed.value = true
  const start = performance.now()

  filteredSongs.value = searchMethod.value === 'contains'
    ? containsFilteredSongs.value
    : fuse.results.value.map(r => r.item)

  searchDuration.value = performance.now() - start
}, { immediate: true })

const currentPage = ref(1)
const pageSize = ref(20)

// 搜索参数处理
const params = useUrlSearchParams('history')
const q = params.q

if (q) {
  inputText.value = typeof q === 'string' ? q : q[0] ?? ''
}

watch(debouncedSearchText, (val) => {
  if (val.length === 0) {
    delete params.q
  }
  else {
    params.q = val
  }
})

const p = params.page
if (p) {
  const n = Number(typeof p === 'string' ? p : p[0])
  if (Number.isFinite(n))
    currentPage.value = n
}

watch(currentPage, (val) => {
  if (val === 1) {
    delete params.page
  }
  else {
    params.page = String(val)
  }
})

// 分页处理
watch(debouncedSearchText, () => {
  currentPage.value = 1
})

const paginatedSongs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredSongs.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(filteredSongs.value.length / pageSize.value))

function goToPrevPage(e: KeyboardEvent) {
  if (isFocusedElementEditable())
    return
  if (currentPage.value > 1) {
    currentPage.value--
    e.preventDefault()
  }
}

function goToNextPage(e: KeyboardEvent) {
  if (isFocusedElementEditable())
    return
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    e.preventDefault()
  }
}

onKeyStroke('ArrowLeft', goToPrevPage)
onKeyStroke('ArrowRight', goToNextPage)

// 属性编辑器弹窗
const editingSong = ref<SongList['songs'][number] | null>(null)
const dialogVisible = ref(false)

function openSongEditor(song: SongList['songs'][number]) {
  editingSong.value = song
  dialogVisible.value = true
}

function saveSongProperties(properties: Record<string, any>) {
  if (editingSong.value) {
    editingSong.value.properties = properties
  }
}

// 编辑模式与多选删除
const editMode = ref(false)
const selectedSongs = ref<SongList['songs'][number][]>([])
const tableRef = useTemplateRef('tableRef')

function handleRowClick(song: SongList['songs'][number], column: any, event: Event) {
  if (!editMode.value)
    return
  if (column.type === 'selection')
    return
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.closest('.el-checkbox'))
    return
  openSongEditor(song)
}

function handleSelectionChange(rows: SongList['songs'][number][]) {
  selectedSongs.value = rows
}

function deleteSelectedSongs() {
  if (selectedSongs.value.length === 0)
    return
  const ids = new Set(selectedSongs.value.map(s => s.id))
  songlist.value.songs = songlist.value.songs.filter(s => !ids.has(s.id))
  selectedSongs.value = []
  tableRef.value?.clearSelection()
}

// 属性定义管理
const schemaDialogVisible = ref(false)

function handlePropertiesUpdate(newProperties: PropertyType[]) {
  const oldIds = new Set(songlist.value.properties.map(p => p.id))
  const newIds = new Set(newProperties.map(p => p.id))

  for (const song of songlist.value.songs) {
    for (const id of oldIds) {
      if (!newIds.has(id)) {
        delete song.properties[id]
      }
    }
    for (const prop of newProperties) {
      if (!oldIds.has(prop.id) && !prop.optional) {
        song.properties[prop.id] = prop.default
      }
    }
  }

  songlist.value.properties = newProperties
}
</script>

<template>
  <section class="box-border min-h-full w-full border-box p-5 max-md:p-3">
    <header class="mb-3.5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
      <div>
        <ElText class="mb-4 text-22px font-650 leading-1.25 mb-4">
          歌单编辑
        </ElText>
        <ElText class="mt-1.5 text-13px" type="info">
          <template v-if="searchPerformed">
            已展示 {{ filteredSongs.length }} / {{ songs.length }} 首歌曲 · 搜索用时 {{
              searchDuration < 1 ? '<1' : Math.round(searchDuration) }}ms
          </template>
          <template v-else>
            共 {{ songs.length }} 首歌曲
          </template>
        </ElText>
      </div>
      <div class="flex items-center gap-2">
        <ElButton size="small" @click="schemaDialogVisible = true">
          编辑属性
        </ElButton>
        <!-- TODO 删除按钮未显示 -->
        <template v-if="editMode && selectedSongs.length > 0">
          <ElButton type="danger" size="small" plain @click="deleteSelectedSongs">
            删除选中 ({{ selectedSongs.length }})
          </ElButton>
        </template>
        <ElTooltip :content="editMode ? '点击行编辑属性，勾选行进行删除' : '开启后出现多选框，可编辑或删除歌曲'" placement="top">
          <ElSwitch v-model="editMode" active-text="编辑模式" inactive-text="浏览模式" inline-prompt />
        </ElTooltip>
        <ElTooltip :content="searchMethod === 'fuse' ? '模糊搜索（Fuse.js），支持容错匹配' : '分词匹配（空格分词，任一匹配即可）'" placement="top">
          <ElSwitch
            v-model="searchMethod" active-value="fuse" inactive-value="contains" active-text="模糊搜索"
            inactive-text="分词匹配" inline-prompt class="search-method-switch"
          />
        </ElTooltip>
      </div>
    </header>

    <ElInput
      ref="searchInput" v-model="inputText" autofocus placeholder="搜索歌曲" class="mb-4" maxlength="50" clearable
      show-word-limit
    />

    <ElTable
      ref="tableRef"
      :data="paginatedSongs" border row-key="id" stripe
      class="song-list-table w-full overflow-hidden rounded-8px shadow-[0_10px_28px_rgb(31_41_55_/_8%)]"
      :class="{ 'is-editing': editMode }"
      @row-click="handleRowClick"
    >
      <ElTableColumn v-if="editMode" type="selection" width="50" align="center" @selection-change="handleSelectionChange" />
      <ElTableColumn
        v-for="(property) in displayProperties" :key="property.id" :label="property.displayName"
        min-width="190" show-overflow-tooltip
      >
        <template #default="{ row: song }">
          <PropertyComponent :property="property" :value="song.properties[property.id] ?? property.default" />
        </template>
      </ElTableColumn>
    </ElTable>

    <PropertyEditorDialog
      v-model:visible="dialogVisible"
      :song="editingSong"
      :properties="songlist.properties"
      @save="saveSongProperties"
    />

    <PropertySchemaEditorDialog
      v-model:visible="schemaDialogVisible"
      :properties="songlist.properties"
      :songs="songlist.songs"
      @update:properties="handlePropertiesUpdate"
    />

    <div class="pagination-wrapper">
      <!-- TODO 怎么改这玩意的文本？ -->
      <ElPagination
        v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="filteredSongs.length" layout="sizes, prev, pager, next, jumper" background
      />
    </div>
  </section>
</template>

<style scoped>
.song-list-table :deep(.el-table__header th) {
  height: 44px;
  font-weight: 650;
}

.song-list-table :deep(.el-table__body-wrapper) {
  overflow-x: auto;
  min-height: 440px;
}

.song-list-table.is-editing :deep(.el-table__row) {
  cursor: pointer;
}

.pagination-wrapper {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 12px 16px;
  margin-top: -1px;
  background: var(--el-fill-color-blank);
  /* border: 1px solid #e4e7ed; */
  border-radius: 0 0 8px 8px;
  box-shadow: 0 -4px 12px rgb(0 0 0 / 4%);
}
</style>
