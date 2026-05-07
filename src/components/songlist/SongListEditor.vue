<script setup lang="ts">
import 'element-plus/dist/index.css'
import { z } from 'astro/zod'
import { onKeyStroke, onStartTyping, refDebounced, useUrlSearchParams } from '@vueuse/core'
import Fuse from 'fuse.js'

import { songSchema } from '@schema/song'
import {
  ElInput,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus'
import PropertyComponent from './PropertyComponent.vue'

type SongList = z.infer<typeof songSchema>

const sourceUrl = import.meta.env.SSR
  ? 'http://localhost:4321/data/songlist.json'
  : '/data/songlist.json'

const songlist = ref(songSchema.parse(await fetch(sourceUrl).then(res => res.json())))
const displayProperties = computed(() => songlist.value.properties.filter(property => property.show ?? true))

// 搜索处理
const searchInput = useTemplateRef('searchInput')
onStartTyping(() => searchInput.value?.focus())

const inputText = ref('')
const debouncedSearchText = refDebounced(inputText, 200)

const createFuseInstance = (songs: SongList['songs']) => new Fuse(songs, {
  keys: songlist.value.properties
    .filter(property => property.searchWeight > 0)
    .map(property => ({
      name: 'properties.' + property.id,
      weight: property.searchWeight,
    })),
  threshold: 0.9,
})

const songs = computed(() => songlist.value?.songs ?? [])
const fuse = ref(createFuseInstance(songs.value))

watch(songs.value, (newSongs) => {
  fuse.value = createFuseInstance(newSongs)
})

const filteredSongs = computed(() => debouncedSearchText.value.length === 0
  ? songs.value
  : fuse.value.search(debouncedSearchText.value).map(result => result.item)
)

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
  } else {
    params.q = val
  }
})

const p = params.page
if (p) {
  const n = Number(typeof p === 'string' ? p : p[0])
  if (Number.isFinite(n)) currentPage.value = n
}

watch(currentPage, (val) => {
  if (val === 1) {
    delete params.page
  } else {
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
  if (currentPage.value > 1) {
    currentPage.value--
    e.preventDefault()
  }
}

function goToNextPage(e: KeyboardEvent) {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    e.preventDefault()
  }
}

onKeyStroke('ArrowLeft', goToPrevPage)
onKeyStroke('ArrowRight', goToNextPage)
</script>

<template>
  <section class="box-border min-h-full w-full border-box bg-#f6f8fb p-5 max-md:p-3">
    <header class="mb-3.5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
      <div>
        <h1 class="mb-4 text-22px text-#1f2937 font-650 leading-1.25 mb-4">
          歌单编辑
        </h1>
        <p class="mt-1.5 text-13px text-#667085">
          {{ songs.length }} 首歌曲 · {{ displayProperties.length }} 个展示字段
        </p>
      </div>
    </header>

    <el-input v-model="inputText" ref="searchInput" placeholder="搜索歌曲" class="mb-4" />

    <el-table :data="paginatedSongs" border row-key="id"
      class="song-list-table w-full overflow-hidden rounded-8px shadow-[0_10px_28px_rgb(31_41_55_/_8%)]">
      <el-table-column v-for="property in displayProperties" :key="property.id" :label="property.displayName"
        min-width="190" show-overflow-tooltip>
        <template #default="{ row }">
          <PropertyComponent :property="property" :value="row.properties[property.id] ?? property.default" />
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <!-- TODO 怎么改这玩意的文本？ -->
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="filteredSongs.length" layout="sizes, prev, pager, next, jumper" background>
      </el-pagination>
    </div>
  </section>
</template>

<style scoped>
.song-list-table :deep(.el-table__header th) {
  height: 44px;
  background: #f9fafb;
  color: #344054;
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
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 -4px 12px rgb(0 0 0 / 4%);
}
</style>
