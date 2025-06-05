<script setup lang="ts">
import { franc, francAll } from 'franc';
let lang = franc('더는 망설이지 마 제발'); //=> 'afr'
console.log(lang); // 'afr'
</script>

<template>
  <div class="mx-auto mt-20 w-[800px]">
    <GVideo />
    <div>
      <UInput type="file" />
    </div>
  </div>
</template>
