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
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <rect x="13" y="11" width="8" height="6" rx="1" />
    <path
      d="M11 13l-4-4m0 0h3m-3 0v3"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>
