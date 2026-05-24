<script setup lang="ts">
import type { Subtitle, SubtitleLoader, VideoInfo } from '@guoxk/gplayer'
import { GVideo } from '@guoxk/gplayer'

// -----------------------------------------------------------------------
// Load video list from server
// -----------------------------------------------------------------------
const { data } = await useFetch<VideoInfo[]>('/api/video')
const videoList = computed(() => data.value ?? [])

// -----------------------------------------------------------------------
// SubtitleLoader — fetch subtitle JSON from the demo server API
// -----------------------------------------------------------------------
const subtitleLoader: SubtitleLoader = async (
  lang: string,
  name: string,
): Promise<Subtitle> => {
  return $fetch<Subtitle>('/api/lyric', { query: { lang, name } })
}

// -----------------------------------------------------------------------
// Lyric file upload (SRT / LRC → JSON converter demo)
// -----------------------------------------------------------------------
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

// ISO 639-3 language code for the uploaded file
const uploadLang = ref('cmn')

async function uploadLyric() {
  if (!inputRef.value?.files?.length)
    return
  const file = inputRef.value.files[0]!
  const formData = new FormData()
  formData.append('file', file)
  formData.append('lang', uploadLang.value)

  const data = await $fetch('/api/lyric', { method: 'POST', body: formData })

  if ('error' in (data as object)) {
    console.error((data as { error: string }).error)
    return
  }

  // Download the converted JSON
  const jsonString = JSON.stringify(
    (data as { message: unknown }).message,
    null,
    2,
  )
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${file.name.split('.')[0]}.json`,
    style: 'display:none',
  })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="mx-auto mt-4 w-[800px]">
    <ClientOnly>
      <GVideo
        :video-list="videoList"
        :conterols="true"
        :autoplay="false"
        :muted="false"
        :subtitle-loader="subtitleLoader"
      />
    </ClientOnly>

    <!-- Lyric converter section -->
    <div class="mt-12 rounded-lg border border-gray-200 p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-700">
        字幕文件转换工具
      </h2>
      <p class="mb-4 text-sm text-gray-500">
        上传 SRT 或 LRC 字幕文件，转换为 gplayer 所需的 JSON 格式。
        需要指定语言代码（ISO 639-3），用于区分不同语言字幕。
      </p>

      <div class="flex items-center gap-4">
        <!-- Language code input -->
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">语言代码 (ISO 639-3)</label>
          <input
            v-model="uploadLang"
            type="text"
            placeholder="cmn / kor / eng"
            class="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-violet-400 focus:outline-none"
          >
        </div>

        <!-- File upload button -->
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">字幕文件 (.srt / .lrc)</label>
          <label
            for="file-upload"
            class="inline-flex cursor-pointer items-center rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
          >
            📎 选择文件并转换
          </label>
          <input
            id="file-upload"
            ref="inputRef"
            type="file"
            accept=".srt,.lrc"
            class="hidden"
            @change="uploadLyric"
          >
        </div>
      </div>

      <p class="mt-3 text-xs text-gray-400">
        常用语言代码：中文 <code>cmn</code>、韩文 <code>kor</code>、英文
        <code>eng</code>、日文 <code>jpn</code>
      </p>
    </div>
  </div>
</template>
