<script setup lang="ts">
const count = ref(0)
</script>

<template>
  <button
    class="w-30 h-30 bg-red-500 text-white rounded-full hover:bg-red-500
        transition-all duration-300 h-114514
        text-4xl cursor-pointer"
    @click="count++"
  >
    {{ count }}
  </button>
</template>
