<script setup lang="ts">
import type { VideoInfo } from '~/types'

const inputRef = useTemplateRef<HTMLInputElement | null>('inputRef')

async function uploadLyric() {
  if (!inputRef.value)
    return
  const files = inputRef.value.files
  if (files && files.length > 0) {
    const formData = new FormData()
    formData.append('file', files[0] as File)
    const data = await $fetch('/api/lyric', {
      method: 'POST',
      body: formData,
    })
    if ('error' in data) {
      console.error(data.error)
    }
    else {
      // 1. 把 JSON 对象转成字符串
      const jsonString = JSON.stringify(data, null, 2)

      // 2. 创建一个 Blob 对象，类型是 json
      const blob = new Blob([jsonString], { type: 'application/json' })

      // 3. 生成一个临时 URL
      const url = URL.createObjectURL(blob)

      // 4. 创建 a 标签，设置下载链接
      const a = document.createElement('a')
      a.href = url
      const filenameArr = files[0]!.name.split('.')
      let filename = ''
      for (const index in filenameArr) {
        if (Number(index) === filenameArr.length - 1) {
          filename += '.json'
        }
        else {
          filename = filename + filenameArr[index]
        }
      }
      a.download = `${files[0]!.name.split('.')[0]}.json` // 下载的文件名

      // 5. 触发点击
      a.click()

      // 6. 释放 URL 对象
      URL.revokeObjectURL(url)
    }
  }
}

const { data } = useFetch('/api/video', {
  method: 'get',
})

const videoList: VideoInfo[] = data.value as VideoInfo[]
</script>

<template>
  <div class="mx-auto mt-4 w-[800px]">
    <GVideo :video-list="videoList" :autoplay="true" :muted="false" />
    <div class="mt-40">
      <label
        for="file-upload"
        class="inline-flex cursor-pointer items-center rounded-2xl bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-violet-700"
      >
        📎 上传歌词
      </label>
      <input
        id="file-upload"
        ref="inputRef"
        type="file"
        class="hidden"
        @change="uploadLyric"
      >
      <NuxtTime datetime="2025-06-10" />
    </div>
  </div>
</template>
