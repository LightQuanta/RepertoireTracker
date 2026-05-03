<script setup lang=ts>
import { getPropertySchema, songSchema } from '@schema/song'

const songlist = ref(songSchema.parse({
  songs: [{
    id: '4c6ec2b1-fcbb-4d7f-a19e-ab0976ddef3d',
    properties: {
      title: 'Test Song',
      artist: ['Test Artist'],
    },
  }],
}))

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
    <div v-for="song in songlist.songs" :key="song.id" class="flex flex-row gap-2">
      <!-- TODO 渲染为对应属性组件 -->
      <div v-for="property in displayProperties" :key="property.id" class="border border-black flex-1">
        {{ getPropertySchema(property).parse(song.properties[property.id]) }}
      </div>
    </div>
  </div>
</template>
