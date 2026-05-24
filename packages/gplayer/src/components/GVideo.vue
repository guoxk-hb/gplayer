<script setup lang="ts">
import type { UseMouseSourceType } from '@vueuse/core'
import type { Representation } from 'dashjs'
import type { Ref, ShallowRef } from 'vue'
import type {
  Subtitle,
  SubtitleLoader,
  VideoInfo,
  VideoSubtitle,
} from '../types'
import { useDateFormat, useMouseInElement } from '@vueuse/core'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watchEffect,
} from 'vue'
import { useCurrentLyric } from '../composables/useCurrentLyric'
import { GuoPlayer } from '../composables/usePlayer'

const {
  videoList = [],
  conterols = true,
  muted = true,
  autoplay = false,
  loop = false,
  // fluid = false,
  preload = 'auto',
  volume: PropVolume = 1,
  subtitlesButton = true,
  subtitleLoader,
} = defineProps<Props>()

const videoRef = useTemplateRef<HTMLVideoElement>('video')

const media: Ref<null | GuoPlayer> = ref(null)

interface Props {
  videoList?: VideoInfo[]
  conterols?: boolean
  muted?: boolean
  autoplay?: boolean
  loop?: boolean
  // fluid?: boolean;
  volume?: number
  subtitlesButton?: boolean
  preload?: string
  subtitleLoader?: SubtitleLoader
}

const index = ref(0)
const currentVideo = ref(videoList[index.value]) as Ref<VideoInfo>

function toggleQuality(item: Quality) {
  if (media.value) {
    media.value.toggleQuality(item)
  }
}

const volumnIconDict = ref({
  1: 'ri:volume-up-fill',
  0.5: 'ri:volume-down-fill',
  0: 'ri:volume-mute-fill',
})
const paused = computed(() => {
  return media.value?.state.paused
})

const canplay = computed(() => {
  return media.value?.state.canplay
})

const loaded = computed(() => {
  return media.value?.state.loaded
})

const videoMuted = computed(() => {
  return media.value?.state.options?.muted
})

const currentTime = computed(() => {
  if (media.value) {
    return useDateFormat(media.value.state.currentTime, 'mm:ss')
  }
  else {
    return '00:00'
  }
})

const duration = computed(() => {
  if (media.value) {
    return useDateFormat(media.value.state.duration, 'mm:ss')
  }
  else {
    return '00:00'
  }
})
const initVolume = ref(PropVolume)

// const volume = computed(() => {
//   return media.value?.state.volume;
// });

const playPercentage = computed(() => {
  if (media.value) {
    return media.value.state.playPercentage
  }
  return 0
})
const bufferPercentage = computed(() => {
  if (media.value) {
    return media.value.state.bufferPercentage
  }
  return 0
})

const isFullscreen = computed(() => {
  return media.value?.state.isFullscreen
})

const isPictureInPicture = computed(() => {
  return media.value?.state.isPictureInPicture
})

const error = computed(() => {
  return media.value?.state.error
})

const qualityList = computed(() => {
  return media.value?.state.qualityList || []
})

const currentQuality = computed(() => {
  return media.value?.state.currentQuality
})

let clickTimer: NodeJS.Timeout | null = null

function playOrPause(e: PointerEvent) {
  e.stopPropagation()
  if (e.detail < 2) {
    clickTimer = setTimeout(() => {
      if (media.value) {
        if (paused.value) {
          media.value.play()
        }
        else {
          media.value.pause()
        }
      }
      clickTimer = null
    }, 200)
  } // 250ms 是一个合适的判断间隔
}

function volumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (media.value) {
    media.value.volumeChange(Number.parseFloat(target.value))
    initVolume.value = Number.parseFloat(target.value)
  }
}

const playerRef = useTemplateRef<HTMLDivElement>('guoPlayer')

const progressRef = useTemplateRef<HTMLDivElement>('progressRef')

const thumbRef = useTemplateRef<HTMLDivElement>('thumbRef')

let isMove = false

function onBarPointStart(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  isMove = true
  thumbRef.value!.setPointerCapture(event.pointerId)
}

function onBarPointMove(event: PointerEvent) {
  event.stopPropagation()
  if (!isMove)
    return
  let newLeft = event.clientX - progressRef.value!.getBoundingClientRect().left
  if (newLeft < 0) {
    newLeft = 0
  }
  const rightEdge
    = progressRef.value!.offsetWidth - thumbRef.value!.offsetWidth
  if (newLeft > rightEdge) {
    newLeft = rightEdge
  }
  const percentage = newLeft / progressRef.value!.offsetWidth
  thumbRef.value!.style.left = `${percentage * 100}%`
}

function onBarPointEnd(event: PointerEvent) {
  event.stopPropagation()
  isMove = false
  if (media.value) {
    const percentage = Number(thumbRef.value!.style.left.split('%')[0]) / 100
    media.value.timeChange(percentage * media.value.state.duration) // 根据百分比计算新的时间
  }
}

function changeTime(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (media.value) {
    const target = event.target as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const x = event.clientX - rect.left // 鼠标点击位置相对于进度条的左边距
    const percentage = x / progressRef.value!.offsetWidth // 计算点击位置的百分比
    media.value.timeChange(percentage * media.value.state.duration) // 根据百分比计算新的时间
    thumbRef.value!.style.left = `${percentage * 100}%`
  }
}

function togglefullScrren(e: MouseEvent) {
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  e.stopPropagation()
  if (media.value) {
    if (!isFullscreen.value) {
      media.value.fullScreen(playerRef.value as HTMLDivElement)
    }
    else {
      media.value.exitFullScreen()
    }
  }
}

function togglePictureInPicture() {
  if (media.value) {
    if (!isPictureInPicture.value) {
      media.value.pictureInPicture()
    }
    else {
      media.value.exitPictureInPicture()
    }
  }
}

interface Quality {
  label: string
  representation: Representation
}

let subtitleList: Subtitle[] = []

const subtitlesRef = useTemplateRef<HTMLDivElement>('subtitlesRef')

function adjustFontSize() {
  const containerWidth = playerRef.value!.clientWidth
  const baseSize = 10 // 基础字体大小（像素）
  const minSize = baseSize
  const maxSize = baseSize * 3 // 最大字体大小为两倍基础大小
  const factor = 0.01 // 调整因子
  let newSize = baseSize + containerWidth * factor
  newSize = Math.max(minSize, Math.min(newSize, maxSize)) // 确保在最小和最大值之间
  if (!subtitlesRef.value)
    return
  subtitlesRef.value.style.fontSize = `${newSize}px`
}
const isShowSubtitles = ref(false)

const doubleSubtitle = ref(false)

const primarySubtitle = ref<Subtitle | null>(null)
const secondarySubtitle = ref<Subtitle | null>(null)

async function toggleSubtitlesVisible(isShow: boolean) {
  isShowSubtitles.value = isShow
  if (isShowSubtitles.value) {
    toggleSubtitles(currentVideo.value.subtitles[0]!, 'primary')
    if (doubleSubtitle.value) {
      toggleSubtitles(currentVideo.value.subtitles[1]!, 'secondary')
    }
  }
}

function toggleDoubleSubtitle() {
  doubleSubtitle.value = !doubleSubtitle.value
  if (doubleSubtitle.value && isShowSubtitles.value) {
    toggleSubtitles(currentVideo.value.subtitles[1]!, 'secondary')
  }
  if (!doubleSubtitle.value) {
    secondarySubtitle.value = null
  }
}

async function toggleSubtitles(item: VideoSubtitle, type: string) {
  await getLyric(item.lang, currentVideo.value.name)
  const lyricObj
    = subtitleList.find(lyric => lyric.lang === item.lang) ?? null
  if (type === 'primary') {
    primarySubtitle.value = lyricObj
  }
  else {
    secondarySubtitle.value = lyricObj
  }
}

async function getLyric(lang: string, name: string) {
  if (subtitleList.find(item => item.lang === lang))
    return
  if (!subtitleLoader) {
    console.warn(
      '[GVideo] subtitleLoader prop is not provided; subtitles cannot be loaded.',
    )
    return
  }
  const subtitleData = await subtitleLoader(lang, name)
  if (subtitleData) {
    subtitleList.push(subtitleData)
  }
}

function back(event?: PointerEvent) {
  event?.stopPropagation()
  if (videoList.length <= 1)
    return
  if (index.value <= 0) {
    index.value = videoList.length - 1
  }
  else {
    index.value--
  }
  changeVideo(index)
}

function forward(event?: PointerEvent) {
  event?.stopPropagation()
  if (videoList.length <= 1)
    return
  if (index.value >= videoList.length - 1) {
    index.value = 0
  }
  else {
    index.value++
  }
  changeVideo(index)
}

function changeVideo(index: Ref<number>) {
  thumbRef.value!.style.left = '0%'
  subtitleList = []
  primarySubtitle.value = null
  secondarySubtitle.value = null
  currentVideo.value = videoList[index.value] as VideoInfo
  media.value?.src(currentVideo.value.url, currentVideo.value.type)
  if (currentVideo.value.subtitles.length < 2) {
    doubleSubtitle.value = false
  }
  toggleSubtitlesVisible(false)
}

function toggleMute() {
  media.value?.toggleMuted()
}

let MouseInTimer: NodeJS.Timeout | null = null

const MouseInVideo = ref(false)

interface MouseInElementType {
  x: ShallowRef<number, number>
  y: ShallowRef<number, number>
  sourceType: ShallowRef<UseMouseSourceType, UseMouseSourceType>
  elementX: ShallowRef<number, number>
  elementY: ShallowRef<number, number>
  elementPositionX: ShallowRef<number, number>
  elementPositionY: ShallowRef<number, number>
  elementHeight: ShallowRef<number, number>
  elementWidth: ShallowRef<number, number>
  isOutside: ShallowRef<boolean, boolean>
  stop: () => void
}

const mouseInElement = ref<null | MouseInElementType>(null)

const isOutside = computed(() => {
  if (mouseInElement.value) {
    return mouseInElement.value.isOutside
  }
  return false
})

watchEffect(() => {
  if (!isOutside.value) {
    MouseInVideo.value = true
    if (MouseInTimer) {
      clearTimeout(MouseInTimer)
    }
  }
  else {
    MouseInTimer = setTimeout(() => {
      MouseInVideo.value = false
    }, 1500)
  }
})

watchEffect(() => {
  if (media.value) {
    thumbRef.value!.style.left = `${(media.value.state.currentTime / media.value.state.duration) * 100}%`
  }
})
onMounted(() => {
  mouseInElement.value = useMouseInElement(videoRef.value)
  media.value = new GuoPlayer(
    videoRef.value as HTMLVideoElement,
    currentVideo.value.url,
    currentVideo.value.type,
    {
      autoplay,
      muted,
      loop,
      preload,
    },
  )
  // 初始调整
  adjustFontSize()
  const observer = new ResizeObserver(() => {
    adjustFontSize()
  })
  observer.observe(playerRef.value as HTMLDivElement)
})

onBeforeUnmount(() => {
  if (media.value) {
    media.value.destroy()
  }
})
</script>

<template>
  <div class="guo-desc mb-2 grid grid-cols-3 gap-2 text-[0.9rem]">
    <div>
      <label>{{ '鼠标是否在视频内' }}</label>
      <span>{{ !isOutside }}</span>
    </div>
    <div>
      <label>{{ '控制栏显示' }}</label>
      <span>{{ MouseInVideo }}</span>
    </div>
    <div>
      <label>{{ '是否可播放' }}</label>
      <span>{{ canplay }}</span>
    </div>
    <div>
      <label>{{ '是否暂停' }}</label>
      <span>{{ paused }}</span>
    </div>
    <div>
      <label>{{ '当前时长' }}</label>
      <span>{{ currentTime }}</span>
    </div>
    <div>
      <label>{{ '完整时长' }}</label>
      <span>{{ duration }}</span>
    </div>
    <div>
      <label>{{ '视频预加载百分比' }}</label>
      <span>{{ `${Math.floor(bufferPercentage * 100)}%` }}</span>
    </div>
    <div>
      <label>{{ '视频进度百分比' }}</label>
      <span>{{ `${Math.floor(playPercentage * 100)}%` }}</span>
    </div>
    <div>
      <label>{{ '当前画质' }}</label>
      <span>{{ currentQuality?.label }}</span>
    </div>
    <div>
      <label>{{ '是否全屏' }}</label>
      <span>{{ isFullscreen }}</span>
    </div>
    <div>
      <label>{{ '是否画中画' }}</label>
      <span>{{ isPictureInPicture }}</span>
    </div>
    <div>
      <label>{{ '音量' }}</label>
      <span>{{ volume }}</span>
    </div>
    <div>
      <label>{{ '字幕' }}</label>
      <span>{{ isShowSubtitles }}</span>
    </div>
    <div>
      <label>{{ '双语字幕' }}</label>
      <span>{{ doubleSubtitle }}</span>
    </div>
    <div>
      <label>{{ '是否静音' }}</label>
      <span>{{ videoMuted }}</span>
    </div>
    <div>
      <label>{{ '预加载模式' }}</label>
      <span>{{ preload }}</span>
    </div>
    <div>
      <label>{{ '自动播放' }}</label>
      <span>{{ autoplay }}</span>
    </div>
  </div>
  <div class="text-center text-red-600 font-semibold text-[0.75rem]">
    <div>
      {{ "注：视频来源与网络，视频目的仅为学习测试用，若侵权联系删除。服务器宽带视频加载速度慢，请谅解。" }}
    </div>
    <div>
      {{ "分别为Baek-hyun（边伯贤）- Elevator、Baek-hyun（边伯贤）- Chocolate、EXO-K - Baby Don't Cry、EXO - History、EXO - Love Me Right" }}
    </div>
  </div>
  <!-- group/control -->
  <div ref="guoPlayer" class="guo-player  relative leading-none">
    <video
      ref="video"
      objectFit="fill"
      class="guo-video bg-#f3f4f6 h-full w-full"
      crossorigin="anonymous"
      :preload="preload"
      :loop="loop"
      :muted="muted"
      @pointerdown.capture="playOrPause"
      @dblclick.capture="togglefullScrren"
    />
    <div
      v-show="loaded"
      class="guo-poster absolute left-0 top-0 z-50 h-full w-full bg-gray-900/90" @pointerdown="playOrPause"
    >
      <div
        class="guo-loading-icon absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
      >
        <Icon name="ri:play-circle-fill" style="color: #f3f4f6" size="3rem" />
      </div>
    </div>
    <div
      v-show="!canplay"
      class="guo-loading absolute left-0 top-0 z-50 h-full w-full bg-gray-900/90"
    >
      <div
        class="guo-loading-icon absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
      >
        <Icon
          name="ri:loader-3-fill"
          style="color: #f3f4f6"
          class="animate-spin"
          size="3rem"
        />
      </div>
    </div>
    <div
      v-show="error"
      class="guo-error absolute left-0 top-0 z-50 h-full w-full bg-gray-900/90"
    >
      <div
        class="guo-error-icon absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
      >
        <Icon name="ri:error-warning-line" style="color: #f3f4f6" size="3rem" />
      </div>
    </div>
    <div v-if="currentVideo" class="absolute bottom-0 w-full">
      <div
        v-if="isShowSubtitles"
        ref="subtitlesRef"
        class="guo-subtitles m-auto mb-2 w-fit text-center text-gray-200"
      >
        <div class="guo-subtitles-text">
          <div class="guo-subtitles-text-content">
            <div class="h-[2em]">
              <div
                v-if="
                  useCurrentLyric(
                    primarySubtitle?.body ?? [],
                    media?.state.currentTime ?? 0,
                  )
                "
                class="guo-subtitles-text-content-text my-[0.25em] rounded-sm bg-gray-900/60 px-[0.5em] py-[0.5em]"
              >
                {{
                  useCurrentLyric(
                    primarySubtitle?.body ?? [],
                    media?.state.currentTime ?? 0,
                  )
                }}
              </div>
            </div>
            <div v-if="doubleSubtitle" class="h-[2em]">
              <div
                v-if="
                  useCurrentLyric(
                    secondarySubtitle?.body ?? [],
                    media?.state.currentTime ?? 0,
                  )
                "
                class="guo-subtitles-text-content-text my-[0.25em] rounded-sm bg-gray-900/60 px-[0.5em] py-[0.5em]"
              >
                {{
                  useCurrentLyric(
                    secondarySubtitle?.body ?? [],
                    media?.state.currentTime ?? 0,
                  )
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-show="conterols"
        class="guo-conrols delay-3000 flex h-0 w-full items-center gap-2 overflow-hidden bg-gray-900/50 px-2 text-gray-50 opacity-0 transition-all duration-300 ease-in-out"
        :class="{ 'h-8 overflow-visible opacity-100': MouseInVideo }"
      >
        <!-- group-hover/control:h-8 group-hover/control:overflow-visible group-hover/control:opacity-100 -->
        <div
          v-show="videoList.length > 1"
          class="guo-skip-back"
          @pointerdown.stop="back($event)"
        >
          <Icon size="20" name="ri:skip-back-fill" style="color: #f3f4f6" />
        </div>
        <div class="guo-play" @pointerdown.stop="playOrPause">
          <Icon
            v-show="paused"
            size="20"
            name="ri:play-fill"
            style="color: #f3f4f6"
          />
          <Icon v-show="!paused" size="20" name="ri:pause-fill" style="color: #f3f4f6" />
        </div>
        <div
          v-show="videoList.length > 1"
          class="guo-skip-forward"
          @pointerdown.stop="forward($event)"
        >
          <Icon size="20" name="ri:skip-forward-fill" style="color: #f3f4f6" />
        </div>
        <div class="guo-current-time">
          {{ currentTime }}
        </div>
        <div class="guo-progress mr-1 flex flex-1 items-center">
          <div
            ref="progressRef"
            class="guo-progress-bar relative h-1 w-full cursor-pointer rounded-full bg-gray-400/50"
          >
            <div
              ref="thumbRef"
              :style="{ left: 0 }"
              class="guo-progress-thumb absolute top-[50%] z-30 h-2 w-2 -translate-y-[50%] rounded-sm bg-violet-500"
              @pointerdown.stop="onBarPointStart"
              @pointermove.stop="onBarPointMove"
              @pointerup.stop="onBarPointEnd"
            />
            <div
              class="guo-progress-bar-buffer absolute top-0 z-20 h-full w-full rounded-full bg-indigo-300 bg-transparent"
              @pointerdown.stop="changeTime"
            />
            <div
              class="guo-progress-bar-current relative z-10 h-full rounded-l-full bg-indigo-500 shadow-2xl shadow-indigo-500/50"
              :style="{ width: `${playPercentage * 100}%` }"
            />
            <div
              class="guo-progress-bar-buffer absolute top-0 h-full rounded-full bg-indigo-300"
              :style="{ width: `${bufferPercentage * 100}%` }"
            />
          </div>
        </div>
        <div class="guo-time">
          {{ duration }}
        </div>
        <div class="guo-volume group/volume relative flex overflow-hidden">
          <div class="group-hover/volume:pr-2">
            <Icon
              v-show="initVolume === 0 || videoMuted"
              size="20"
              :name="volumnIconDict[0]"
              style="color: #f3f4f6"
              @click.stop="toggleMute"
            />
            <Icon
              v-show="0 < initVolume && initVolume <= 0.5 && !videoMuted"
              size="20"
              :name="volumnIconDict[0.5]"
              style="color: #f3f4f6"
              @click.stop="toggleMute"
            />
            <Icon
              v-show="0.5 < initVolume && initVolume <= 1 && !videoMuted"
              size="20"
              :name="volumnIconDict[1]"
              style="color: #f3f4f6"
              @click.stop="toggleMute"
            />
          </div>
          <div
            class="w-0 overflow-hidden leading-[10px] shadow transition-all duration-300 ease-in-out group-hover/volume:w-24"
          >
            <input
              type="range"
              class="guo-volume-bar w-full cursor-pointer appearance-none rounded-full"
              min="0"
              max="1"
              step="0.01"
              :value="initVolume"
              @input="volumeChange"
            >
          </div>
        </div>
        <div
          v-if="currentQuality"
          class="guo-quality group/quality relative h-8 select-none leading-8"
        >
          <div class="guo-quality-current">
            {{ currentQuality.label }}
          </div>
          <div
            class="guo-quality-all absolute bottom-full left-[50%] w-[200%] -translate-x-[50%] rounded-t-sm bg-gray-900/50 p-1 leading-none opacity-0 transition-all duration-300 group-hover/quality:opacity-100"
          >
            <div
              v-for="item in qualityList"
              :key="item.label"
              class="box-bo my-1 w-full cursor-pointer py-1 text-center hover:bg-gray-50/10"
              :class="{
                'text-violet-500': currentQuality.label === item.label,
              }"
              @pointerdown.stop="toggleQuality(item as Quality)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
        <div
          v-if="subtitlesButton && currentVideo.subtitles?.length > 0"
          class="guo-subtitles group/subtitles relative h-8 select-none leading-8"
        >
          <div
            class="guo-subtitles-current relative"
            @pointerdown.stop="toggleSubtitlesVisible(!isShowSubtitles)"
          >
            <Icon
              v-show="isShowSubtitles"
              name="solar:subtitles-bold"
              style="color: #f3f4f6"
              title=""
              size="20"
            />
            <Icon
              v-show="!isShowSubtitles"
              size="20"
              name="solar:subtitles-linear"
              style="color: #f3f4f6"
            />
          </div>
          <div
            class="guo-subtitles-all absolute -right-4 bottom-full hidden w-fit rounded-t-sm bg-gray-900/50 p-1 px-4 text-left text-[0.9em] leading-none group-hover/subtitles:block"
            absolute
            bottom-full
          >
            <div v-if="currentVideo.subtitles.length >= 2" class="mt-2 w-full">
              <span>双语字幕</span>
              <label
                class="relative ml-2 inline-flex cursor-pointer items-center"
              >
                <input
                  id="switch"
                  type="checkbox"
                  :value="doubleSubtitle"
                  class="peer sr-only"
                  @input="toggleDoubleSubtitle"
                >
                <label
                  for="switch"
                  class="before:top-0.25 before:left-0.25 inline-flex h-3 w-6 items-center justify-between rounded-full bg-gray-200 before:absolute before:h-2.5 before:w-2.5 before:rounded-full before:border before:border-gray-300 before:bg-white before:transition-all peer-checked:bg-blue-600 peer-checked:before:translate-x-3 peer-checked:before:border-transparent peer-checked:before:bg-white peer-focus:before:outline-none"
                />
              </label>
            </div>
            <div
              class="h-auto text-left transition-all duration-500 ease-in-out"
              :class="{
                'w-48': doubleSubtitle,
                'w-24': !doubleSubtitle && currentVideo.subtitles.length >= 2,
                'w-14': currentVideo.subtitles.length < 2,
              }"
            >
              <div
                class="w-42 mx-3 flex justify-between"
                :class="{ 'mx-3': doubleSubtitle }"
              >
                <div class="w-auto">
                  <div
                    class="my-1 py-1 text-[0.75em]"
                    :class="{
                      visible: doubleSubtitle,
                      invisible: !doubleSubtitle,
                      hidden: currentVideo.subtitles.length < 2,
                    }"
                  >
                    {{ '主字幕' }}
                  </div>
                  <div
                    v-for="item in currentVideo.subtitles"
                    :key="item.lang"
                    class="my-1 w-full py-1"
                    :class="{
                      'text-violet-500': item.lang === primarySubtitle?.lang,
                    }"
                    @pointerdown.stop="toggleSubtitles(item, 'primary')"
                  >
                    {{ item.label }}
                  </div>
                </div>
                <Transition
                  appear
                  enter-active-class="transition-all duration-500 ease-in-out"
                  leave-active-class="transition-all duration-500 ease-in-out"
                  enter-from-class="opacity-0 translate-x-4"
                  leave-to-class="opacity-0 translate-x-4"
                >
                  <div v-show="doubleSubtitle" class="w-auto">
                    <div class="my-1 py-1 text-[0.75em]">
                      {{ '副字幕' }}
                    </div>
                    <div
                      v-for="item in currentVideo.subtitles"
                      :key="item.lang"
                      class="my-1 w-full py-1"
                      :class="{
                        'text-violet-500':
                          item.lang === secondarySubtitle?.lang,
                      }"
                      @pointerdown.stop="toggleSubtitles(item, 'secondary')"
                    >
                      {{ item.label }}
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
        <div
          class="guo-picture-in-picture"
          @pointerdown.stop="togglePictureInPicture"
        >
          <Icon
            v-show="!isPictureInPicture"
            size="20"
            name="ri:picture-in-picture-2-fill"
            style="color: #f3f4f6"
          />
          <Icon
            v-show="isPictureInPicture"
            size="20"
            name="ri:picture-in-picture-exit-fill"
            style="color: #f3f4f6"
          />
        </div>
        <div class="guo-fullscreen" @pointerdown.stop="togglefullScrren">
          <Icon
            v-show="!isFullscreen"
            size="20"
            name="ri:fullscreen-fill"
            style="color: #f3f4f6"
          />
          <Icon
            v-show="isFullscreen"
            size="20"
            name="ri:fullscreen-exit-fill"
            style="color: #f3f4f6"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guo-desc > div {
  padding: 2px 10px;
  border: 1px solid #ccc;
}

.guo-desc > div > label {
  padding-right: 5px;
  border-right: 1px solid #ccc;
  /* border: solid #ccc; */
}

.guo-desc > div > label::after {
  content: ':';
}

.guo-desc > div > span {
  padding-left: 5px;
  /* border: 1px solid #ccc; */
}

.iconify,
/* input {
  vertical-align: text-bottom;
  font-size: 16px;
} */

.guo-conrols>* {
  vertical-align: middle;
}

/* 全屏样式 */
.guo-player:-webkit-full-screen {
  margin: 0;
  width: 100%;
  height: 100%;
  background: black;
}

.guo-player:-moz-full-screen {
  margin: 0;
  width: 100%;
  height: 100%;
  background: black;
}

.guo-player:-ms-fullscreen {
  margin: 0;
  width: 100%;
  height: 100%;
  background: black;
}

.guo-player:fullscreen {
  margin: 0;
  width: 100%;
  height: 100%;
  background: black;
}

.guo-volume-bar {
  /* -webkit-appearance: none; */
  /* 清除默认样式 */
  /* background: transparent; */
  /* 清除默认背景 */
  text-align: center;

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    background: linear-gradient(to right, #c7d2fe, #818cf8 30%, #6366f1 100%);
    border-radius: 1rem;
  }

  &::-moz-range-track {
    width: 100%;
    height: 4px;
    background: linear-gradient(to right, #c7d2fe, #818cf8 30%, #6366f1 100%);
    border-radius: 1rem;
  }

  /* 滑块样式 - Webkit (Chrome, Safari, Edge) */
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: 8px;
    margin-top: -2px;
    background: #fff;
    border: 1px solid #6366f1;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  }

  /* 滑块样式 - Firefox */
  &::-moz-range-thumb {
    width: 8px;
    height: 8px;
    background: #fff;
    border: 1px solid #6366f1;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  }

  /* 悬停和聚焦状态 */
  &::-webkit-slider-thumb:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &::-moz-range-thumb:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    outline: none;
  }

  /* &:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
  }

  &:focus::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
  } */
}
</style>
