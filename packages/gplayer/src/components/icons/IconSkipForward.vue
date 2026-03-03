<script setup lang="ts">
defineProps<{ size?: string | number; color?: string }>();
</script>
<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    :fill="color ?? 'currentColor'"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 18l8.5-6L6 6v12zm8.5-6L14.5 6H16.5v12h-2z" />
  </svg>
</template>
