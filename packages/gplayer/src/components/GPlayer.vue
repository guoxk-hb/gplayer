<script setup lang="ts">
import type { Ref } from 'vue'
import type {
  Quality,
  Subtitle,
  SubtitleLoader,
  VideoInfo,
  VideoSubtitle,
} from '../types'
import { useMouseInElement } from '@vueuse/core'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import { useCurrentLyric } from '../composables/useCurrentLyric'
import { GuoPlayer } from '../composables/usePlayer'

interface Props {
  videoList?: VideoInfo[]
  conterols?: boolean
  controls?: boolean
  muted?: boolean
  autoplay?: boolean
  loop?: boolean
  volume?: number
  subtitlesButton?: boolean
  preload?: string
  subtitleLoader?: SubtitleLoader
}

const props = withDefaults(defineProps<Props>(), {
  videoList: () => [],
  conterols: true,
  muted: true,
  autoplay: false,
  loop: false,
  volume: 1,
  subtitlesButton: true,
  preload: 'auto',
})

const videoRef = useTemplateRef<HTMLVideoElement>('video')
const playerRef = useTemplateRef<HTMLDivElement>('guoPlayer')
const progressRef = useTemplateRef<HTMLDivElement>('progressRef')
const thumbRef = useTemplateRef<HTMLDivElement>('thumbRef')
const subtitlesRef = useTemplateRef<HTMLDivElement>('subtitlesRef')

const media: Ref<GuoPlayer | null> = ref(null)
const index = ref(0)
const currentVideo = ref<VideoInfo | null>(null)
const initVolume = ref(props.volume)
const isShowSubtitles = ref(false)
const doubleSubtitle = ref(false)
const primarySubtitle = ref<Subtitle | null>(null)
const secondarySubtitle = ref<Subtitle | null>(null)
const mouseInVideo = ref(false)
const isDraggingProgress = ref(false)

let subtitleList: Subtitle[] = []
let clickTimer: ReturnType<typeof setTimeout> | null = null
let mouseInTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null
let stopMouseTracking: (() => void) | undefined
let isMounted = false

const controlsVisible = computed(() => props.controls ?? props.conterols)
const paused = computed(() => media.value?.state.paused ?? true)
const canplay = computed(() => media.value?.state.canplay ?? false)
const loaded = computed(() => media.value?.state.loaded ?? false)
const videoMuted = computed(() => media.value?.state.options?.muted ?? false)
const playPercentage = computed(() => media.value?.state.playPercentage ?? 0)
const bufferPercentage = computed(
  () => media.value?.state.bufferPercentage ?? 0,
)
const isFullscreen = computed(
  () => media.value?.state.isFullscreen ?? false,
)
const isPictureInPicture = computed(
  () => media.value?.state.isPictureInPicture ?? false,
)
const error = computed(() => media.value?.state.error ?? false)
const qualityList = computed(() => media.value?.state.qualityList ?? [])
const currentQuality = computed(() => media.value?.state.currentQuality)
const volumeLabel = computed(() => {
  if (videoMuted.value || initVolume.value === 0)
    return 'Mute'
  if (initVolume.value <= 0.5)
    return 'Vol'
  return 'Vol+'
})
const currentSubtitleText = computed(() =>
  useCurrentLyric(
    primarySubtitle.value?.body ?? [],
    media.value?.state.currentTime ?? 0,
  ),
)
const secondarySubtitleText = computed(() =>
  useCurrentLyric(
    secondarySubtitle.value?.body ?? [],
    media.value?.state.currentTime ?? 0,
  ),
)
const currentTime = computed(() =>
  formatTime(media.value?.state.currentTime ?? 0),
)
const duration = computed(() => formatTime(media.value?.state.duration ?? 0))

function formatTime(time: number) {
  if (!Number.isFinite(time) || time <= 0)
    return '00:00'

  const totalSeconds = Math.floor(time / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function resetSubtitleState() {
  subtitleList = []
  primarySubtitle.value = null
  secondarySubtitle.value = null
  isShowSubtitles.value = false
  doubleSubtitle.value = false
}

function resetProgressThumb() {
  if (thumbRef.value) {
    thumbRef.value.style.left = '0%'
  }
}

function createPlayer(video: VideoInfo) {
  if (!isMounted || !videoRef.value)
    return

  media.value?.destroy()
  media.value = new GuoPlayer(videoRef.value, video.url, video.type, {
    autoplay: props.autoplay,
    muted: props.muted,
    loop: props.loop,
    preload: props.preload,
  })
  media.value.volumeChange(initVolume.value)
  if (props.muted) {
    media.value.toggleMuted()
  }
}

function changeVideo(nextIndex: number) {
  const nextVideo = props.videoList[nextIndex]
  if (!nextVideo)
    return

  index.value = nextIndex
  resetProgressThumb()
  resetSubtitleState()
  currentVideo.value = nextVideo
}

function back(event?: PointerEvent) {
  event?.stopPropagation()
  if (props.videoList.length <= 1)
    return

  changeVideo(index.value <= 0 ? props.videoList.length - 1 : index.value - 1)
}

function forward(event?: PointerEvent) {
  event?.stopPropagation()
  if (props.videoList.length <= 1)
    return

  changeVideo(index.value >= props.videoList.length - 1 ? 0 : index.value + 1)
}

function playOrPause(event: PointerEvent) {
  event.stopPropagation()
  if (event.detail >= 2)
    return

  clickTimer = setTimeout(() => {
    if (!media.value)
      return

    if (paused.value)
      media.value.play()
    else
      media.value.pause()

    clickTimer = null
  }, 200)
}

function volumeChange(event: Event) {
  const target = event.target as HTMLInputElement
  const nextVolume = Number.parseFloat(target.value)

  if (!media.value)
    return

  media.value.volumeChange(nextVolume)
  initVolume.value = nextVolume
}

function onBarPointStart(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDraggingProgress.value = true
  thumbRef.value?.setPointerCapture(event.pointerId)
}

function onBarPointMove(event: PointerEvent) {
  event.stopPropagation()
  if (!isDraggingProgress.value || !progressRef.value || !thumbRef.value)
    return

  const rect = progressRef.value.getBoundingClientRect()
  const rightEdge = progressRef.value.offsetWidth - thumbRef.value.offsetWidth
  const newLeft = Math.min(Math.max(event.clientX - rect.left, 0), rightEdge)
  const percentage = newLeft / progressRef.value.offsetWidth

  thumbRef.value.style.left = `${percentage * 100}%`
}

function onBarPointEnd(event: PointerEvent) {
  event.stopPropagation()
  isDraggingProgress.value = false
  if (!media.value || !thumbRef.value)
    return

  const percentage = Number(thumbRef.value.style.left.split('%')[0]) / 100
  media.value.timeChange(percentage * media.value.state.duration)
}

function changeTime(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (!media.value || !progressRef.value || !thumbRef.value)
    return

  const rect = progressRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = Math.min(Math.max(x / progressRef.value.offsetWidth, 0), 1)

  media.value.timeChange(percentage * media.value.state.duration)
  thumbRef.value.style.left = `${percentage * 100}%`
}

function toggleFullscreen(event: MouseEvent | PointerEvent) {
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  event.stopPropagation()

  if (!media.value || !playerRef.value)
    return

  if (!isFullscreen.value)
    media.value.fullScreen(playerRef.value)
  else
    media.value.exitFullScreen()
}

function togglePictureInPicture() {
  if (!media.value)
    return

  if (!isPictureInPicture.value)
    media.value.pictureInPicture()
  else
    media.value.exitPictureInPicture()
}

function toggleQuality(item: Quality) {
  media.value?.toggleQuality(item)
}

function adjustFontSize() {
  if (!playerRef.value || !subtitlesRef.value)
    return

  const baseSize = 10
  const nextSize = Math.max(
    baseSize,
    Math.min(baseSize + playerRef.value.clientWidth * 0.01, baseSize * 3),
  )

  subtitlesRef.value.style.fontSize = `${nextSize}px`
}

async function toggleSubtitlesVisible(isShow: boolean) {
  if (!currentVideo.value?.subtitles.length)
    return

  isShowSubtitles.value = isShow
  if (!isShowSubtitles.value)
    return

  await toggleSubtitles(currentVideo.value.subtitles[0]!, 'primary')
  if (doubleSubtitle.value && currentVideo.value.subtitles[1]) {
    await toggleSubtitles(currentVideo.value.subtitles[1], 'secondary')
  }
}

async function toggleDoubleSubtitle() {
  doubleSubtitle.value = !doubleSubtitle.value
  if (
    doubleSubtitle.value
    && isShowSubtitles.value
    && currentVideo.value?.subtitles[1]
  ) {
    await toggleSubtitles(currentVideo.value.subtitles[1], 'secondary')
  }

  if (!doubleSubtitle.value) {
    secondarySubtitle.value = null
  }
}

async function toggleSubtitles(item: VideoSubtitle, type: 'primary' | 'secondary') {
  if (!currentVideo.value)
    return

  await getLyric(item.lang, currentVideo.value.name)
  const lyricObj = subtitleList.find(lyric => lyric.lang === item.lang) ?? null

  if (type === 'primary')
    primarySubtitle.value = lyricObj
  else
    secondarySubtitle.value = lyricObj
}

async function getLyric(lang: string, name: string) {
  if (subtitleList.find(item => item.lang === lang))
    return

  if (!props.subtitleLoader) {
    console.warn(
      '[GVideo] subtitleLoader prop is not provided; subtitles cannot be loaded.',
    )
    return
  }

  const subtitleData = await props.subtitleLoader(lang, name)
  if (subtitleData) {
    subtitleList.push(subtitleData)
  }
}

function toggleMute() {
  media.value?.toggleMuted()
}

watch(
  () => props.videoList,
  (list) => {
    if (!list.length) {
      index.value = 0
      currentVideo.value = null
      media.value?.destroy()
      media.value = null
      resetSubtitleState()
      resetProgressThumb()
      return
    }

    const currentIndex = currentVideo.value
      ? list.findIndex(item => item.url === currentVideo.value?.url)
      : -1

    if (currentIndex >= 0) {
      index.value = currentIndex
      return
    }

    changeVideo(Math.min(index.value, list.length - 1))
  },
  { immediate: true },
)

watch(currentVideo, (video, oldVideo) => {
  if (!video)
    return

  if (!media.value) {
    createPlayer(video)
    return
  }

  if (!oldVideo || video.url !== oldVideo.url || video.type !== oldVideo.type) {
    media.value.src(video.url, video.type)
  }
})

watch(
  () => media.value?.state.currentTime,
  () => {
    if (!media.value || !thumbRef.value || isDraggingProgress.value)
      return

    const duration = media.value.state.duration
    const percentage = duration ? media.value.state.currentTime / duration : 0
    thumbRef.value.style.left = `${Math.min(Math.max(percentage, 0), 1) * 100}%`
  },
)

onMounted(() => {
  isMounted = true

  if (videoRef.value) {
    const mouse = useMouseInElement(videoRef)
    stopMouseTracking = mouse.stop
    watch(
      mouse.isOutside,
      (isOutside) => {
        if (!isOutside) {
          mouseInVideo.value = true
          if (mouseInTimer) {
            clearTimeout(mouseInTimer)
            mouseInTimer = null
          }
          return
        }

        mouseInTimer = setTimeout(() => {
          mouseInVideo.value = false
        }, 1500)
      },
      { immediate: true },
    )
  }

  if (playerRef.value) {
    resizeObserver = new ResizeObserver(adjustFontSize)
    resizeObserver.observe(playerRef.value)
  }

  if (currentVideo.value) {
    createPlayer(currentVideo.value)
  }
})

onBeforeUnmount(() => {
  media.value?.destroy()
  stopMouseTracking?.()
  resizeObserver?.disconnect()

  if (clickTimer) {
    clearTimeout(clickTimer)
  }
  if (mouseInTimer) {
    clearTimeout(mouseInTimer)
  }
})
</script>

<template>
  <div ref="guoPlayer" class="guo-player">
    <div v-if="!currentVideo" class="guo-empty">
      No video source
    </div>

    <template v-else>
      <video
        ref="video"
        class="guo-video"
        crossorigin="anonymous"
        :preload="props.preload"
        :loop="props.loop"
        :muted="props.muted"
        @pointerdown.capture="playOrPause"
        @dblclick.capture="toggleFullscreen"
      />

      <button
        v-show="loaded"
        type="button"
        class="guo-poster"
        aria-label="Play video"
        @pointerdown="playOrPause"
      >
        <span class="guo-poster-icon">Play</span>
      </button>

      <div v-show="!canplay" class="guo-loading" aria-live="polite">
        <span class="guo-loading-icon">Load</span>
      </div>

      <div v-show="error" class="guo-error" aria-live="assertive">
        <span class="guo-error-icon">Error</span>
      </div>

      <div class="guo-bottom">
        <div v-if="isShowSubtitles" ref="subtitlesRef" class="guo-subtitles">
          <div class="guo-subtitles-text-content">
            <div class="guo-subtitles-line">
              <span
                v-if="currentSubtitleText"
                class="guo-subtitles-text-content-text"
              >
                {{ currentSubtitleText }}
              </span>
            </div>
            <div v-if="doubleSubtitle" class="guo-subtitles-line">
              <span
                v-if="secondarySubtitleText"
                class="guo-subtitles-text-content-text"
              >
                {{ secondarySubtitleText }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-show="controlsVisible"
          class="guo-controls"
          :class="{ 'is-visible': mouseInVideo }"
        >
          <button
            v-show="props.videoList.length > 1"
            type="button"
            class="guo-control-button"
            aria-label="Previous video"
            @pointerdown.stop="back($event)"
          >
            Prev
          </button>

          <button
            type="button"
            class="guo-control-button"
            :aria-label="paused ? 'Play video' : 'Pause video'"
            @pointerdown.stop="playOrPause"
          >
            {{ paused ? 'Play' : 'Pause' }}
          </button>

          <button
            v-show="props.videoList.length > 1"
            type="button"
            class="guo-control-button"
            aria-label="Next video"
            @pointerdown.stop="forward($event)"
          >
            Next
          </button>

          <div class="guo-current-time">
            {{ currentTime }}
          </div>

          <div class="guo-progress">
            <div ref="progressRef" class="guo-progress-bar">
              <div
                ref="thumbRef"
                class="guo-progress-thumb"
                @pointerdown.stop="onBarPointStart"
                @pointermove.stop="onBarPointMove"
                @pointerup.stop="onBarPointEnd"
              />
              <div
                class="guo-progress-bar-seek"
                @pointerdown.stop="changeTime"
              />
              <div
                class="guo-progress-bar-buffer"
                :style="{ width: `${bufferPercentage * 100}%` }"
              />
              <div
                class="guo-progress-bar-current"
                :style="{ width: `${playPercentage * 100}%` }"
              />
            </div>
          </div>

          <div class="guo-time">
            {{ duration }}
          </div>

          <div class="guo-volume">
            <button
              type="button"
              class="guo-control-button guo-volume-icon"
              aria-label="Toggle mute"
              @click.stop="toggleMute"
            >
              {{ volumeLabel }}
            </button>
            <div class="guo-volume-slider-wrap">
              <input
                type="range"
                class="guo-volume-bar"
                min="0"
                max="1"
                step="0.01"
                :value="initVolume"
                aria-label="Volume"
                @input="volumeChange"
              >
            </div>
          </div>

          <div v-if="currentQuality" class="guo-quality">
            <button
              type="button"
              class="guo-quality-current"
              aria-label="Current quality"
            >
              {{ currentQuality.label }}
            </button>
            <div class="guo-quality-menu">
              <button
                v-for="item in qualityList"
                :key="item.label"
                type="button"
                class="guo-quality-item"
                :class="{ 'is-active': currentQuality.label === item.label }"
                @pointerdown.stop="toggleQuality(item)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div
            v-if="props.subtitlesButton && currentVideo.subtitles.length > 0"
            class="guo-subtitles-btn"
          >
            <button
              type="button"
              class="guo-control-button"
              :aria-pressed="isShowSubtitles"
              @pointerdown.stop="toggleSubtitlesVisible(!isShowSubtitles)"
            >
              CC
            </button>

            <div class="guo-subtitles-menu">
              <div
                v-if="currentVideo.subtitles.length >= 2"
                class="guo-double-subtitle-row"
              >
                <span>Dual</span>
                <label class="guo-toggle">
                  <input
                    type="checkbox"
                    :checked="doubleSubtitle"
                    @input="toggleDoubleSubtitle"
                  >
                  <span class="guo-toggle-track" />
                  <span class="guo-toggle-thumb" />
                </label>
              </div>

              <div
                class="guo-subtitles-menu-inner"
                :class="{
                  'is-double': doubleSubtitle,
                  'is-single':
                    !doubleSubtitle && currentVideo.subtitles.length >= 2,
                  'is-minimal': currentVideo.subtitles.length < 2,
                }"
              >
                <div class="guo-subtitles-col">
                  <div
                    class="guo-subtitles-col-label"
                    :class="{
                      'is-hidden': !doubleSubtitle,
                      'is-removed': currentVideo.subtitles.length < 2,
                    }"
                  >
                    Main
                  </div>
                  <button
                    v-for="item in currentVideo.subtitles"
                    :key="item.lang"
                    type="button"
                    class="guo-subtitles-item"
                    :class="{ 'is-active': item.lang === primarySubtitle?.lang }"
                    @pointerdown.stop="toggleSubtitles(item, 'primary')"
                  >
                    {{ item.label }}
                  </button>
                </div>

                <Transition
                  appear
                  enter-active-class="guo-slide-enter-active"
                  leave-active-class="guo-slide-leave-active"
                  enter-from-class="guo-slide-enter-from"
                  leave-to-class="guo-slide-leave-to"
                >
                  <div v-show="doubleSubtitle" class="guo-subtitles-col">
                    <div class="guo-subtitles-col-label">
                      Second
                    </div>
                    <button
                      v-for="item in currentVideo.subtitles"
                      :key="item.lang"
                      type="button"
                      class="guo-subtitles-item"
                      :class="{
                        'is-active': item.lang === secondarySubtitle?.lang,
                      }"
                      @pointerdown.stop="toggleSubtitles(item, 'secondary')"
                    >
                      {{ item.label }}
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="guo-control-button"
            :aria-pressed="isPictureInPicture"
            @pointerdown.stop="togglePictureInPicture"
          >
            PiP
          </button>

          <button
            type="button"
            class="guo-control-button"
            :aria-pressed="isFullscreen"
            @pointerdown.stop="toggleFullscreen"
          >
            {{ isFullscreen ? 'Exit' : 'Full' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
