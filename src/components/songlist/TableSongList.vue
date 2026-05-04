<script setup lang=ts>
import { getPropertySchema, songSchema } from '@schema/song'

let url = '/data/songlist.json'
if (import.meta.env.SSR) {
  // TODO 有没有正常的方法获取dev server的host
  url = `http://localhost:4321${url}`
}

// await fetch(url).then(d => d.json()).then(d => console.log(d))

const songlist = ref(songSchema.parse(await fetch(url).then(d => d.json())))

const displayProperties = computed(() => {
  return songlist.value.properties.filter(p => p.show ?? true)
})
</script>

<template>
  <!-- TODO 换成表格？ -->
  <div>
    <!-- 首行属性列表 -->
    <div class="flex flex-row gap-2">
      <div v-for="property in displayProperties" :key="property.id" class="border border-black flex-1">
        {{ property.displayName }}
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div v-for="song in songlist?.songs ?? []" :key="song.id" class="flex flex-row gap-2">
      <!-- TODO 渲染为对应属性组件 -->
      <div v-for="property in displayProperties" :key="property.id" class="border border-black flex-1">
        {{ getPropertySchema(property).parse(song.properties[property.id]) }}
      </div>
    </div>
  </div>
</template>
