<script setup lang="ts">
import 'element-plus/dist/index.css'
import { z } from 'astro/zod'
import { onStartTyping, refDebounced } from '@vueuse/core'
import Fuse from 'fuse.js'

import { songSchema } from '@schema/song'
import {
  ElInput,
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

const fuse = ref(createFuseInstance(songlist.value.songs))

watch(songlist.value.songs, (newSongs) => {
  fuse.value = createFuseInstance(newSongs)
})

const filteredSongs = computed(() => {
  return debouncedSearchText.value.length === 0
    ? songlist.value.songs
    : fuse.value.search(debouncedSearchText.value).map(result => result.item)
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

    <el-input v-model="inputText" ref="searchInput" placeholder="搜索歌曲" class="mb-4" />

    <el-table :data="filteredSongs" border row-key="id"
      class="song-list-table w-full overflow-hidden rounded-8px shadow-[0_10px_28px_rgb(31_41_55_/_8%)]">
      <el-table-column v-for="property in displayProperties" :key="property.id" :label="property.displayName"
        min-width="190" show-overflow-tooltip>
        <template #default="{ row }">
          <PropertyComponent :property="property" :value="row.properties[property.id] ?? property.default" />
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
</style>
