<script setup lang="ts">
import type { UseFuseOptions } from '@vueuse/integrations/useFuse'
import type { SongData, SongInfo, SongProperty } from '@/config/song'
import PropertyComponent from '@components/songlist/PropertyComponent.vue'
import PropertyEditorDialog from '@components/songlist/PropertyEditorDialog.vue'
import PropertySchemaEditorDialog from '@components/songlist/PropertySchemaEditorDialog.vue'
import { onKeyStroke, onStartTyping, refDebounced, useEventListener, useFileDialog, useRefHistory, useUrlSearchParams } from '@vueuse/core'

import { useFuse } from '@vueuse/integrations/useFuse'
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElDivider,
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
import { songDataLoader } from '@/config/config'
import { reloadConfig, resetConfig } from '@/config/configLoader'

import 'element-plus/dist/index.css'

const isDev = import.meta.env.DEV

const STORAGE_KEY = 'songlist-editor-backup'

let data: SongData | undefined
let loadedFromBackup = false
try {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = songDataLoader.schema.safeParse(JSON.parse(stored))
    if (parsed.success) {
      data = parsed.data
      loadedFromBackup = true
    }
  }
}
catch {
}

const songData = ref<SongData>(data ?? await songDataLoader.load())
const displayProperties = computed(() => songData.value.properties.filter(property => property.show ?? true))

const history = useRefHistory(songData, {
  deep: true,
  clone: true,
})

const { undo, redo, canUndo, canRedo } = history
const isDirty = ref(loadedFromBackup)

watch(songData, (val) => {
  isDirty.value = true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }
  catch {
  }
}, { deep: true })

useEventListener(window, 'beforeunload', (e) => {
  if (isDirty.value) {
    e.preventDefault()
  }
})

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

const songs = computed(() => songData.value?.songs ?? [])

const fuseOptions = computed(() => ({
  fuseOptions: {
    keys: songData.value.properties
      .filter(property => property.searchWeight > 0)
      .map(property => ({
        name: `properties.${property.id}`,
        weight: property.searchWeight,
      })),
    isCaseSensitive: false,
    threshold: 0.9,
  },
  matchAllWhenSearchEmpty: true,
} as UseFuseOptions<SongInfo>))

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
  const searchablePropertyIds = songData.value.properties
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

// TODO 这玩意到底能不能正常实现
// const p = params.page
// if (p) {
//   const n = Number(typeof p === 'string' ? p : p[0])
//   if (Number.isFinite(n))
//     currentPage.value = n
// }

// watch(currentPage, (val) => {
//   if (val === 1) {
//     delete params.page
//   }
//   else {
//     params.page = String(val)
//   }
// })

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

// 撤销 / 重做
onKeyStroke('z', (e) => {
  if (isFocusedElementEditable())
    return
  if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
    e.preventDefault()
    redo()
  }
  else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
    e.preventDefault()
    undo()
  }
})

// Ctrl+S 保存
onKeyStroke('s', (e) => {
  if ((e.ctrlKey || e.metaKey) && !isFocusedElementEditable()) {
    e.preventDefault()
    handleSave()
  }
})

// 属性编辑器弹窗
const editingSong = ref<SongInfo | null>(null)
const dialogVisible = ref(false)
const isNewSong = ref(false)

function openSongEditor(song: SongInfo) {
  editingSong.value = song
  dialogVisible.value = true
}

function saveSongProperties(properties: Record<string, any>) {
  if (editingSong.value) {
    editingSong.value.properties = properties
    if (isNewSong.value) {
      songData.value.songs.push(editingSong.value)
      isNewSong.value = false
    }
  }
}

watch(dialogVisible, (val) => {
  if (!val)
    isNewSong.value = false
})

function buildDefaultProperties() {
  const props: Record<string, any> = {}
  for (const property of songData.value.properties) {
    if (!property.optional) {
      try {
        props[property.id] = JSON.parse(JSON.stringify(property.default))
      }
      catch {
        ElMessage.error(`属性 "${property.displayName}" 的默认值解析失败！`)
      }
    }
  }
  return props
}

function addSong() {
  const newSong: SongInfo = {
    id: crypto.randomUUID(),
    properties: buildDefaultProperties(),
  }
  isNewSong.value = true
  openSongEditor(newSong)
}

// 多选与删除
const selectedSongs = ref<SongInfo[]>([])
const tableRef = useTemplateRef('tableRef')

function handleSelectionChange(rows: SongInfo[]) {
  selectedSongs.value = rows
}

const showingDeleteSelectedSongsDialog = ref(false)

async function deleteSelectedSongs() {
  if (selectedSongs.value.length === 0)
    return

  showingDeleteSelectedSongsDialog.value = true
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedSongs.value.length} 首歌曲吗？`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
    const ids = new Set(selectedSongs.value.map(s => s.id))
    songData.value.songs = songData.value.songs.filter(s => !ids.has(s.id))
    selectedSongs.value = []
    tableRef.value?.clearSelection()
    ElMessage.success(`已删除 ${ids.size} 首歌曲`)
  }
  catch {
    // 用户取消
  }
  finally {
    showingDeleteSelectedSongsDialog.value = false
  }
}

onKeyStroke('Delete', (e) => {
  if (!isFocusedElementEditable() && selectedSongs.value.length > 0 && !showingDeleteSelectedSongsDialog.value) {
    e.preventDefault()
    deleteSelectedSongs()
  }
})

async function deleteSong(song: SongInfo) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${song.id}」吗？`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
    songData.value.songs = songData.value.songs.filter(s => s.id !== song.id)
    ElMessage.success(`已删除 ${song.id}`)
  }
  catch {
    // 用户取消
  }
}

async function clearAllSongs() {
  if (songData.value.songs.length === 0) {
    ElMessage.info('歌单已经是空的')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定清空全部 ${songData.value.songs.length} 首歌曲吗？`,
      '确认清空',
      { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' },
    )
    songData.value.songs = []
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
  if (import.meta.env.DEV) {
    try {
      await ElMessageBox.confirm(
        '确定重置并保存配置文件吗？所有自定义的歌曲数据和属性将丢失',
        '确认重置',
        { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' },
      )
    }
    catch {
      return
    }

    resetting.value = true
    try {
      const defaultConfig = await resetConfig(songDataLoader)
      if (defaultConfig) {
        songData.value = defaultConfig as SongData
        try {
          localStorage.removeItem(STORAGE_KEY)
        }
        catch {
        }
        selectedSongs.value = []
        tableRef.value?.clearSelection()

        // 抽象
        nextTick(() => {
          isDirty.value = false
        })

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
}

// 属性定义管理
const schemaDialogVisible = ref(false)

function handlePropertiesUpdate(newProperties: SongProperty[]) {
  const oldIds = new Set(songData.value.properties.map(p => p.id))
  const newIds = new Set(newProperties.map(p => p.id))

  for (const song of songData.value.songs) {
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

  songData.value.properties = newProperties
}

const saving = ref(false)

async function handleSave() {
  if (import.meta.env.DEV) {
    saving.value = true
    try {
      const success = await reloadConfig(songDataLoader, songData.value)
      if (success) {
        try {
          localStorage.removeItem(STORAGE_KEY)
        }
        catch {
        }
        isDirty.value = false
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
}

const discardding = ref(false)

function discardChanges() {
  ElMessageBox.confirm('确定放弃修改吗？', {
    confirmButtonText: '确认放弃',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    discardding.value = true
    songData.value = await songDataLoader.load()
    try {
      localStorage.removeItem(STORAGE_KEY)
    }
    catch {
    }
    nextTick(() => {
      isDirty.value = false
    })
    discardding.value = false
  })
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(songData.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'songdata.json'
  a.click()
  URL.revokeObjectURL(url)
}

const { open: importJSON, onChange: onImportFileChange } = useFileDialog({
  accept: '.json',
})

onImportFileChange(async (files) => {
  const file = files?.[0]
  if (!file)
    return

  try {
    const text = await file.text()
    const result = songDataLoader.schema.safeParse(JSON.parse(text))

    if (!result.success) {
      ElMessage.error('导入失败：文件格式与歌单数据结构不匹配')
      console.warn('[Import] 导入的数据校验失败', result.error.issues)
      return
    }

    songData.value = result.data as SongData
    ElMessage.success(`已导入 ${result.data.songs.length} 首歌曲`)
  }
  catch (error) {
    ElMessage.error('导入失败：文件格式错误')
    console.error(error)
  }
})
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
        <div class="flex items-center gap-2">
          <ElText class="" size="large">
            歌单编辑
          </ElText>
          <ElText size="small" :type="isDirty ? 'danger' : 'success'">
            {{ isDirty ? '● 未保存' : '● 已保存' }}
          </ElText>
        </div>
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
        <!-- TODO 优化布局和样式 -->
        <ElButton size="small" type="primary" @click="schemaDialogVisible = true">
          编辑属性
        </ElButton>
        <ElDivider direction="vertical" />
        <ElButton size="small" :disabled="!canUndo" @click="undo">
          撤销
        </ElButton>
        <ElButton size="small" :disabled="!canRedo" @click="redo">
          重做
        </ElButton>
        <ElDivider direction="vertical" />
        <ElButton type="primary" size="small" @click="addSong">
          添加歌曲
        </ElButton>
        <template v-if="selectedSongs.length > 0">
          <ElButton type="danger" size="small" plain @click="deleteSelectedSongs">
            删除选中 ({{ selectedSongs.length }})
          </ElButton>
        </template>
        <ElButton size="small" type="danger" @click="clearAllSongs">
          清空歌曲
        </ElButton>
        <ElDivider direction="vertical" />

        <ElButton v-if="isDev" size="small" type="danger" :loading="resetting" @click="handleReset">
          重置配置
        </ElButton>
        <ElDivider v-if="isDev" direction="vertical" />

        <ElButton size="small" type="danger" :disabled="!isDirty" :loading="discardding" @click="discardChanges">
          放弃修改
        </ElButton>
        <ElButton v-if="isDev" type="success" size="small" :disabled="!isDirty" :loading="saving" @click="handleSave">
          保存
        </ElButton>

        <ElDivider direction="vertical" />
        <ElButton size="small" @click="importJSON()">
          导入 JSON
        </ElButton>
        <ElButton size="small" @click="downloadJSON">
          导出 JSON
        </ElButton>
        <ElDivider direction="vertical" />

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
      <ElTableColumn v-if="isDev" type="selection" width="50" align="center" />
      <ElTableColumn
        v-for="(property) in displayProperties" :key="property.id" :label="property.displayName"
        min-width="190" show-overflow-tooltip
      >
        <template #default="{ row: song }">
          <PropertyComponent :property="property" :value="song.properties[property.id] ?? property.default" />
        </template>
      </ElTableColumn>
      <ElTableColumn v-if="isDev" label="操作" width="130" fixed="right" align="center">
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
      v-model:visible="dialogVisible" :song="editingSong" :properties="songData.properties"
      @save="saveSongProperties"
    />

    <PropertySchemaEditorDialog
      v-model:visible="schemaDialogVisible" :properties="songData.properties"
      :songs="songData.songs" @update:properties="handlePropertiesUpdate"
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
