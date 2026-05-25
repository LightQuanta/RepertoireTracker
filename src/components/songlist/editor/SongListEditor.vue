<script setup lang="ts">
import type { UseFuseOptions } from '@vueuse/integrations/useFuse'
import type { z } from 'astro/zod'
import type { PropertyType, songSchema } from '@/config/song'
import PropertyComponent from '@components/songlist/PropertyComponent.vue'
import PropertyEditorDialog from '@components/songlist/PropertyEditorDialog.vue'
import PropertySchemaEditorDialog from '@components/songlist/PropertySchemaEditorDialog.vue'

import { onKeyStroke, onStartTyping, refDebounced, useUrlSearchParams } from '@vueuse/core'
import { useFuse } from '@vueuse/integrations/useFuse'
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElInput,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElText,
  ElTooltip,
} from 'element-plus'
import { songConfigLoader } from '@/config/config'
import { reloadConfig, resetConfig } from '@/config/configLoader'

import 'element-plus/dist/index.css'

type SongList = z.infer<typeof songSchema>

// TODO 性能优化？
const songlist = ref(await songConfigLoader.load())
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

function buildDefaultProperties() {
  const props: Record<string, any> = {}
  for (const property of songlist.value.properties) {
    if (!property.optional) {
      props[property.id] = JSON.parse(JSON.stringify(property.default))
    }
  }
  return props
}

function addSong() {
  const newSong: SongList['songs'][number] = {
    id: crypto.randomUUID(),
    properties: buildDefaultProperties(),
  }
  songlist.value.songs.push(newSong)
  openSongEditor(newSong)
}

// 多选与删除
const selectedSongs = ref<SongList['songs'][number][]>([])
const tableRef = useTemplateRef('tableRef')

function handleSelectionChange(rows: SongList['songs'][number][]) {
  selectedSongs.value = rows
}

async function deleteSelectedSongs() {
  if (selectedSongs.value.length === 0)
    return
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedSongs.value.length} 首歌曲吗？此操作不可撤销。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
    const ids = new Set(selectedSongs.value.map(s => s.id))
    songlist.value.songs = songlist.value.songs.filter(s => !ids.has(s.id))
    selectedSongs.value = []
    tableRef.value?.clearSelection()
    ElMessage.success(`已删除 ${ids.size} 首歌曲`)
  }
  catch {
    // 用户取消
  }
}

async function deleteSong(song: SongList['songs'][number]) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${song.properties.title ?? '未命名'}」吗？此操作不可撤销。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
    songlist.value.songs = songlist.value.songs.filter(s => s.id !== song.id)
    ElMessage.success('已删除')
  }
  catch {
    // 用户取消
  }
}

async function clearAllSongs() {
  if (songlist.value.songs.length === 0) {
    ElMessage.info('歌单已经是空的')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定清空全部 ${songlist.value.songs.length} 首歌曲吗？此操作不可撤销。`,
      '确认清空',
      { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' },
    )
    songlist.value.songs = []
    selectedSongs.value = []
    tableRef.value?.clearSelection()
    ElMessage.success('已清空全部歌曲')
  }
  catch {
    // 用户取消
  }
}

const resetting = ref(false)

async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '确定重置配置文件吗？自定义的歌曲数据和属性将丢失，回退到默认配置。',
      '确认重置',
      { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' },
    )
  }
  catch {
    return
  }

  resetting.value = true
  try {
    const defaultConfig = await resetConfig(songConfigLoader)
    if (defaultConfig) {
      songlist.value = defaultConfig as SongList
      selectedSongs.value = []
      tableRef.value?.clearSelection()
      ElMessage.success('已重置为默认配置')
    }
    else {
      ElMessage.error('重置失败，请查看控制台日志')
    }
  }
  catch {
    ElMessage.error('重置失败，请检查开发服务器是否正常运行')
  }
  finally {
    resetting.value = false
  }
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

const saving = ref(false)

async function handleSave() {
  saving.value = true
  try {
    const success = await reloadConfig(songConfigLoader, songlist.value)
    if (success) {
      ElMessage.success('保存成功')
    }
    else {
      ElMessage.error('保存失败，请查看控制台日志')
    }
  }
  catch {
    ElMessage.error('保存失败，请检查开发服务器是否正常运行')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="flex flex-col h-full box-border min-h-full w-full border-box p-5 max-md:p-3">
    <ElBreadcrumb separator="/" class="mb-2">
      <ElBreadcrumbItem>
        <ElLink href="/">
          首页
        </ElLink>
      </ElBreadcrumbItem>
      <ElBreadcrumbItem>
        <ElLink>编辑器</ElLink>
      </ElBreadcrumbItem>
    </ElBreadcrumb>
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
        <ElButton type="success" size="small" @click="addSong">
          添加歌曲
        </ElButton>
        <ElButton type="primary" size="small" :loading="saving" @click="handleSave">
          保存
        </ElButton>
        <ElButton size="small" plain @click="clearAllSongs">
          清空歌曲
        </ElButton>
        <ElButton size="small" :loading="resetting" @click="handleReset">
          重置配置
        </ElButton>
        <template v-if="selectedSongs.length > 0">
          <ElButton type="danger" size="small" plain @click="deleteSelectedSongs">
            删除选中 ({{ selectedSongs.length }})
          </ElButton>
        </template>
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
      ref="tableRef" :data="paginatedSongs" border row-key="id" stripe
      class="song-list-table w-full flex-1 overflow-hidden rounded-8px shadow-[0_10px_28px_rgb(31_41_55_/_8%)]"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn type="selection" width="50" align="center" />
      <ElTableColumn
        v-for="(property) in displayProperties" :key="property.id" :label="property.displayName"
        min-width="190" show-overflow-tooltip
      >
        <template #default="{ row: song }">
          <PropertyComponent :property="property" :value="song.properties[property.id] ?? property.default" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="130" fixed="right" align="center">
        <template #default="{ row: song }">
          <div class="flex items-center justify-center gap-1">
            <ElButton size="small" type="primary" link @click="openSongEditor(song)">
              编辑
            </ElButton>
            <ElButton size="small" type="danger" link @click="deleteSong(song)">
              删除
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>

    <PropertyEditorDialog
      v-model:visible="dialogVisible" :song="editingSong" :properties="songlist.properties"
      @save="saveSongProperties"
    />

    <PropertySchemaEditorDialog
      v-model:visible="schemaDialogVisible" :properties="songlist.properties"
      :songs="songlist.songs" @update:properties="handlePropertiesUpdate"
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
