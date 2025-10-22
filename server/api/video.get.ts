import type { VideoInfo } from '~/types'

const videoList: VideoInfo[] = [
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
]

export default defineEventHandler((event) => {
  try {
    return videoList
  }
  catch (error) {
    console.error('Error reading JSON file:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to read JSON file',
    })
  }
})
