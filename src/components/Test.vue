<script setup lang="ts">
const count = ref(0)

async function f() {
  // fetch('/data/songlist.json').then(d => d.json()).then(d => console.log(d))

  const currentSiteConfig = await fetch('/dev/config/get', {
    method: 'POST',
    body: JSON.stringify({ path: 'site.json' }),
  }).then(d => d.json()).then(d => d.data)

  fetch('/dev/config/save', {
    method: 'POST',
    body: JSON.stringify({
      path: 'site.json',
      config: {
        ...currentSiteConfig,
        title: `Repertoire Tracker${Math.random()}`,
      },
    }),
  }).then(d => d.json())

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
