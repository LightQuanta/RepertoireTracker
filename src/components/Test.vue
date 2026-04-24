<script setup lang="ts">
const count = ref(0)

async function f() {
  const res = await fetch('/dev/users', {
    method: 'POST',
    body: 'dljsakjldsalkjdkjlaslkjdajlk',
  })
  console.log(await res.text())
  count.value++
}
</script>

<template>
  <button
    class="w-30 h-30 bg-red-500 text-white rounded-full hover:bg-red-500
        transition-all duration-300 h-114514
        text-4xl cursor-pointer"
    @click="f()"
  >
    {{ count }}
  </button>
</template>
