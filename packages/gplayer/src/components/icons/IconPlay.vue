<script setup lang="ts">
defineProps<{ size?: string | number, color?: string }>()
</script>

<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    :fill="color ?? 'currentColor'"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
</template>
