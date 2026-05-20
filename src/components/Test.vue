<script setup lang="ts">
import { reloadConfig } from '@/config/configLoader'
import { siteConfigLoader } from '@/config/site'

const count = ref(0)

async function f() {
  // fetch('/data/songlist.json').then(d => d.json()).then(d => console.log(d))
  const currentSiteConfig = await siteConfigLoader.load()

  await reloadConfig(siteConfigLoader, {
    ...currentSiteConfig,
    title: `Repertoire Tracker${Math.random()}`,
  })

  count.value++
}
</script>

<template>
  <button
    class="w-30 h-30 bg-red-500 text-white rounded-full hover:bg-red-500
        transition-all duration-300 h-114514
        text-4xl cursor-pointer" @click="f"
  >
    {{ count }}
  </button>
</template>
