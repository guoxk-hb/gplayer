<script setup lang="ts">
defineProps<{ size?: string | number; color?: string }>();
</script>
<template>
  <!-- Subtitles ON — bold style (solar:subtitles-bold) -->
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    :fill="color ?? 'currentColor'"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M3 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H3zm2 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2H5zm6 0a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-8zM5 9a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H5zm10 0a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4z"
    />
  </svg>
</template>
