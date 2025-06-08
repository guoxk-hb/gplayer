<script setup lang="ts">
import type { VideoInfo, Quality } from '~/types';

const inputRef = useTemplateRef<HTMLInputElement | null>('inputRef');

async function uploadLyric() {
  if (!inputRef.value) return;
  const files = inputRef.value.files;
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append('file', files[0] as File);
    const { data, error } = await useFetch('/api/lyric', {
      method: 'POST',
      body: formData,
    });
    if (error.value) {
      alert('请上传lrc或srt文件');
      console.error(error);
    }
    if (data.value) {
      // 1. 把 JSON 对象转成字符串
      const jsonString = JSON.stringify(data.value, null, 2);

      // 2. 创建一个 Blob 对象，类型是 json
      const blob = new Blob([jsonString], { type: 'application/json' });

      // 3. 生成一个临时 URL
      const url = URL.createObjectURL(blob);

      // 4. 创建 a 标签，设置下载链接
      const a = document.createElement('a');
      a.href = url;
      const filenameArr = files[0]!.name.split('.');
      let filename = '';
      for (let index in filenameArr) {
        if (Number(index) == filenameArr.length - 1) {
          filename += '.json';
        } else {
          filename += filenameArr[index];
        }
      }
      a.download = files[0]!.name.split('.')[0] + '.json'; // 下载的文件名

      // 5. 触发点击
      a.click();

      // 6. 释放 URL 对象
      URL.revokeObjectURL(url);
    }
  }
}

const videoList: VideoInfo[] = [
  {
    name: '1',
    url: '/video/1/output.mpd',
    type: 'mpd',
    subtitles: [
      {
        lang: 'cmn',
        label: '中文',
      },
      {
        lang: 'kor',
        label: '韩文',
      },
    ],
  },
  {
    name: '2',
    url: '/video/2/output.mpd',
    type: 'mpd',
    subtitles: [
      {
        lang: 'cmn',
        label: '中文',
      },
      {
        lang: 'kor',
        label: '韩文',
      },
    ],
  },
  {
    name: '3',
    url: '/video/3/output.mpd',
    type: 'mpd',
    subtitles: [
      {
        lang: 'cmn',
        label: '中文',
      },
      {
        lang: 'kor',
        label: '韩文',
      },
    ],
  },
  {
    name: '4',
    url: '/video/4/4.mp4',
    type: 'mp4',
    subtitles: [
      {
        lang: 'cmn',
        label: '中文',
      },
      {
        lang: 'kor',
        label: '韩文',
      },
    ],
  },
  {
    name: '5',
    url: '/video/5/output.m3u8',
    type: 'm3u8',
    subtitles: [
      {
        lang: 'cmn',
        label: '中文',
      },
      {
        lang: 'kor',
        label: '韩文',
      },
    ],
  },
];
</script>

<template>
  <div class="mx-auto mt-20 w-[800px]">
    <GVideo :videoList="videoList" :autoplay="true" />
    <div class="mt-4">
      <label
        for="file-upload"
        class="inline-flex cursor-pointer items-center rounded-2xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-blue-700"
      >
        📎 上传歌词
      </label>
      <input
        ref="inputRef"
        id="file-upload"
        type="file"
        class="hidden"
        @change="uploadLyric"
      />
      <NuxtTime :datetime="new Date()"></NuxtTime>
    </div>
  </div>
</template>
