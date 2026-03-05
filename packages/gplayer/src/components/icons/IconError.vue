<script setup lang="ts">
defineProps<{ size?: string | number, color?: string }>()
</script>

<template>
  <svg
    :width="size ?? 48"
    :height="size ?? 48"
    viewBox="0 0 24 24"
    :fill="color ?? 'currentColor'"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
    />
  </svg>
</template>
