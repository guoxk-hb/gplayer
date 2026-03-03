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
    <path
      d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"
    />
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
  </svg>
</template>
