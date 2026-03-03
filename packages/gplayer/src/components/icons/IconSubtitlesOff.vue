<script setup lang="ts">
defineProps<{ size?: string | number; color?: string }>();
</script>
<template>
  <!-- Subtitles OFF — outline style (solar:subtitles-linear) -->
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color ?? 'currentColor'"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M5 13h4M11 13h8M5 9h8M15 9h4" />
  </svg>
</template>
