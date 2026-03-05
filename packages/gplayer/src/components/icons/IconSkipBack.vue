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
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
</template>
