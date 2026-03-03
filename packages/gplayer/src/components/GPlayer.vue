<script setup lang="ts">
import type {
  Quality,
  Subtitle,
  SubtitleLoader,
  VideoInfo,
  VideoSubtitle,
} from '../types'
import { useMouseInElement } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { useCurrentLyric } from '../composables/useCurrentLyric'
import { GuoPlayer } from '../composables/usePlayer'
import IconError from './icons/IconError.vue'
import IconFullscreen from './icons/IconFullscreen.vue'
import IconFullscreenExit from './icons/IconFullscreenExit.vue'
import IconLoader from './icons/IconLoader.vue'
import IconPause from './icons/IconPause.vue'
import IconPiP from './icons/IconPiP.vue'
import IconPiPExit from './icons/IconPiPExit.vue'
import IconPlay from './icons/IconPlay.vue'
import IconPlayCircle from './icons/IconPlayCircle.vue'
import IconSkipBack from './icons/IconSkipBack.vue'
import IconSkipForward from './icons/IconSkipForward.vue'
import IconSubtitles from './icons/IconSubtitles.vue'
import IconSubtitlesOff from './icons/IconSubtitlesOff.vue'
import IconVolumeDown from './icons/IconVolumeDown.vue'
import IconVolumeMute from './icons/IconVolumeMute.vue'
import IconVolumeUp from './icons/IconVolumeUp.vue'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  videoList?: VideoInfo[]
  controls?: boolean
  muted?: boolean
  autoplay?: boolean
  loop?: boolean
  preload?: string
  volume?: number
  subtitlesButton?: boolean
  /**
   * Async function to load subtitle data.
   * Receives the ISO 639-3 language code and video name; returns a Subtitle object.
   * @example
   * const subtitleLoader = async (lang, name) => {
   *   return await fetch(`/api/lyric?lang=${lang}&name=${name}`).then(r => r.json())
   * }
   */
  subtitleLoader?: SubtitleLoader
}

const {
  videoList = [],
  controls = true,
  muted = false,
  autoplay = false,
  loop = false,
  preload = 'auto',
  volume: propVolume = 1,
  subtitlesButton = true,
  subtitleLoader,
} = defineProps<Props>()

// ---------------------------------------------------------------------------
// Refs
// ---------------------------------------------------------------------------
const videoRef = ref<HTMLVideoElement | null>(null)
const playerRef = ref<HTMLDivElement | null>(null)
const progressRef = ref<HTMLDivElement | null>(null)
const thumbRef = ref<HTMLDivElement | null>(null)
const subtitlesRef = ref<HTMLDivElement | null>(null)

const media = ref<GuoPlayer | null>(null)

// ---------------------------------------------------------------------------
// Current video
// ---------------------------------------------------------------------------
const index = ref(0)
const currentVideo = ref<VideoInfo>(
  videoList[index.value] ?? ({} as VideoInfo),
)

// ---------------------------------------------------------------------------
// Computed state shortcuts
// ---------------------------------------------------------------------------
const paused = computed(() => media.value?.state.paused)
const canplay = computed(() => media.value?.state.canplay)
const loaded = computed(() => media.value?.state.loaded)
const videoMuted = computed(() => media.value?.state.options?.muted)
const isFullscreen = computed(() => media.value?.state.isFullscreen)
const isPictureInPicture = computed(
  () => media.value?.state.isPictureInPicture,
)
const error = computed(() => media.value?.state.error)
const qualityList = computed(() => media.value?.state.qualityList ?? [])
const currentQuality = computed(() => media.value?.state.currentQuality)
const playPercentage = computed(() => media.value?.state.playPercentage ?? 0)
const bufferPercentage = computed(
  () => media.value?.state.bufferPercentage ?? 0,
)

// ---------------------------------------------------------------------------
// Time formatting (no external dep)
// ---------------------------------------------------------------------------
function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const currentTime = computed(() =>
  media.value ? formatTime(media.value.state.currentTime) : '00:00',
)
const duration = computed(() =>
  media.value ? formatTime(media.value.state.duration) : '00:00',
)

// ---------------------------------------------------------------------------
// Init volume
// ---------------------------------------------------------------------------
const initVolume = ref(propVolume)

// ---------------------------------------------------------------------------
// Play / pause (single vs double-click)
// ---------------------------------------------------------------------------
let clickTimer: ReturnType<typeof setTimeout> | null = null

function playOrPause(e: PointerEvent) {
  if (e.detail < 2) {
    clickTimer = setTimeout(() => {
      if (media.value) {
        paused.value ? media.value.play() : media.value.pause()
      }
      clickTimer = null
    }, 200)
  }
}

// ---------------------------------------------------------------------------
// Fullscreen
// ---------------------------------------------------------------------------
function toggleFullscreen(e: MouseEvent) {
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  e.stopPropagation()
  if (!media.value)
    return
  isFullscreen.value
    ? media.value.exitFullScreen()
    : media.value.fullScreen(playerRef.value as HTMLDivElement)
}

// ---------------------------------------------------------------------------
// Picture-in-picture
// ---------------------------------------------------------------------------
function togglePiP() {
  if (!media.value)
    return
  isPictureInPicture.value
    ? media.value.exitPictureInPicture()
    : media.value.pictureInPicture()
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------
function onVolumeChange(e: Event) {
  const val = Number.parseFloat((e.target as HTMLInputElement).value)
  media.value?.volumeChange(val)
  initVolume.value = val
}

function toggleMute() {
  media.value?.toggleMuted()
}

// ---------------------------------------------------------------------------
// Progress bar drag
// ---------------------------------------------------------------------------
let isDragging = false

function onThumbPointerDown(e: PointerEvent) {
  e.preventDefault()
  isDragging = true;
  (thumbRef.value as HTMLDivElement).setPointerCapture(e.pointerId)
}

function onThumbPointerMove(e: PointerEvent) {
  if (!isDragging || !progressRef.value || !thumbRef.value)
    return
  const rect = progressRef.value.getBoundingClientRect()
  let newLeft = e.clientX - rect.left
  newLeft = Math.max(0, Math.min(newLeft, progressRef.value.offsetWidth))
  const pct = newLeft / progressRef.value.offsetWidth
  thumbRef.value.style.left = `${pct * 100}%`
}

function onThumbPointerUp() {
  isDragging = false
  if (!media.value || !thumbRef.value)
    return
  const pct = Number.parseFloat(thumbRef.value.style.left) / 100
  media.value.timeChange(pct * media.value.state.duration)
}

function onProgressClick(e: PointerEvent) {
  if (!media.value || !progressRef.value || !thumbRef.value)
    return
  e.preventDefault()
  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
  const pct = (e.clientX - rect.left) / progressRef.value.offsetWidth
  media.value.timeChange(pct * media.value.state.duration)
  thumbRef.value.style.left = `${pct * 100}%`
}

// Sync thumb position with video playback
watchEffect(() => {
  if (media.value && thumbRef.value) {
    const pct = media.value.state.duration
      ? (media.value.state.currentTime / media.value.state.duration) * 100
      : 0
    thumbRef.value.style.left = `${pct}%`
  }
})

// ---------------------------------------------------------------------------
// Quality
// ---------------------------------------------------------------------------
function toggleQuality(item: Quality) {
  media.value?.toggleQuality(item)
}

// ---------------------------------------------------------------------------
// Subtitles
// ---------------------------------------------------------------------------
let cachedSubtitles: Subtitle[] = []

const isShowSubtitles = ref(false)
const doubleSubtitle = ref(false)
const primarySubtitle = ref<Subtitle | null>(null)
const secondarySubtitle = ref<Subtitle | null>(null)

async function fetchSubtitle(lang: string, name: string): Promise<void> {
  if (cachedSubtitles.find(s => s.lang === lang))
    return
  if (!subtitleLoader) {
    console.warn(
      '[GPlayer] subtitleLoader prop is not provided — cannot load subtitles.',
    )
    return
  }
  try {
    const data = await subtitleLoader(lang, name)
    if (data)
      cachedSubtitles.push(data)
  }
  catch (err) {
    console.error('[GPlayer] subtitleLoader error:', err)
  }
}

async function applySubtitle(
  item: VideoSubtitle,
  type: 'primary' | 'secondary',
) {
  await fetchSubtitle(item.lang, currentVideo.value.name)
  const found = cachedSubtitles.find(s => s.lang === item.lang) ?? null
  if (type === 'primary')
    primarySubtitle.value = found
  else secondarySubtitle.value = found
}

async function toggleSubtitlesVisible(show: boolean) {
  isShowSubtitles.value = show
  if (show && currentVideo.value.subtitles?.length) {
    await applySubtitle(currentVideo.value.subtitles[0]!, 'primary')
    if (doubleSubtitle.value && currentVideo.value.subtitles[1]) {
      await applySubtitle(currentVideo.value.subtitles[1], 'secondary')
    }
  }
}

async function toggleDoubleSubtitle() {
  doubleSubtitle.value = !doubleSubtitle.value
  if (
    doubleSubtitle.value
    && isShowSubtitles.value
    && currentVideo.value.subtitles[1]
  ) {
    await applySubtitle(currentVideo.value.subtitles[1], 'secondary')
  }
  if (!doubleSubtitle.value) {
    secondarySubtitle.value = null
  }
}

// ---------------------------------------------------------------------------
// Playlist navigation
// ---------------------------------------------------------------------------
function back() {
  index.value = index.value <= 0 ? videoList.length - 1 : index.value - 1
  changeVideo()
}

function forward() {
  index.value = index.value >= videoList.length - 1 ? 0 : index.value + 1
  changeVideo()
}

function changeVideo() {
  if (thumbRef.value)
    thumbRef.value.style.left = '0%'
  cachedSubtitles = []
  primarySubtitle.value = null
  secondarySubtitle.value = null
  currentVideo.value = videoList[index.value] as VideoInfo
  media.value?.src(currentVideo.value.url, currentVideo.value.type)
  if (currentVideo.value.subtitles.length < 2)
    doubleSubtitle.value = false
  toggleSubtitlesVisible(false)
}

// ---------------------------------------------------------------------------
// Font size auto-adjust for subtitles
// ---------------------------------------------------------------------------
function adjustFontSize() {
  if (!playerRef.value || !subtitlesRef.value)
    return
  const w = playerRef.value.clientWidth
  const size = Math.min(Math.max(10, 10 + w * 0.01), 30)
  subtitlesRef.value.style.fontSize = `${size}px`
}

// ---------------------------------------------------------------------------
// Mouse-in detection → show/hide controls
// ---------------------------------------------------------------------------
let mouseHideTimer: ReturnType<typeof setTimeout> | null = null
const showControls = ref(true)

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  if (!videoRef.value || !currentVideo.value.url)
    return

  media.value = new GuoPlayer(
    videoRef.value,
    currentVideo.value.url,
    currentVideo.value.type,
    { autoplay, muted, loop, preload },
  )

  adjustFontSize()
  const ro = new ResizeObserver(adjustFontSize)
  ro.observe(playerRef.value as HTMLDivElement)

  // Mouse tracking for controls visibility
  const { isOutside } = useMouseInElement(videoRef)
  watchEffect(() => {
    if (!isOutside.value) {
      showControls.value = true
      if (mouseHideTimer)
        clearTimeout(mouseHideTimer)
    }
    else {
      mouseHideTimer = setTimeout(() => {
        showControls.value = false
      }, 1500)
    }
  })
})

onBeforeUnmount(() => {
  media.value?.destroy()
})
</script>

<template>
  <div ref="playerRef" class="guo-player">
    <!-- Video element -->
    <video
      ref="videoRef"
      class="guo-video"
      crossorigin="anonymous"
      :preload="preload"
      :loop="loop"
      :muted="muted"
      @pointerdown.capture="playOrPause"
      @dblclick.capture="toggleFullscreen"
    />

    <!-- Poster / initial play overlay -->
    <div v-show="loaded" class="guo-poster" @pointerdown="playOrPause">
      <div class="guo-poster-icon">
        <IconPlayCircle :size="48" color="#f3f4f6" />
      </div>
    </div>

    <!-- Loading spinner -->
    <div v-show="!canplay" class="guo-loading">
      <div class="guo-loading-icon">
        <IconLoader :size="48" color="#f3f4f6" />
      </div>
    </div>

    <!-- Error overlay -->
    <div v-show="error" class="guo-error">
      <div class="guo-error-icon">
        <IconError :size="48" color="#f3f4f6" />
      </div>
    </div>

    <!-- Bottom area: subtitles + controls -->
    <div v-if="currentVideo.url" class="guo-bottom">
      <!-- Subtitles -->
      <div v-if="isShowSubtitles" ref="subtitlesRef" class="guo-subtitles">
        <div class="guo-subtitles-text-content">
          <div class="guo-subtitles-line">
            <span
              v-if="
                useCurrentLyric(
                  primarySubtitle?.body ?? [],
                  media?.state.currentTime ?? 0,
                )
              "
              class="guo-subtitles-text-content-text"
            >
              {{
                useCurrentLyric(
                  primarySubtitle?.body ?? [],
                  media?.state.currentTime ?? 0,
                )
              }}
            </span>
          </div>
          <div v-if="doubleSubtitle" class="guo-subtitles-line">
            <span
              v-if="
                useCurrentLyric(
                  secondarySubtitle?.body ?? [],
                  media?.state.currentTime ?? 0,
                )
              "
              class="guo-subtitles-text-content-text"
            >
              {{
                useCurrentLyric(
                  secondarySubtitle?.body ?? [],
                  media?.state.currentTime ?? 0,
                )
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Controls bar -->
      <div
        v-show="controls"
        class="guo-controls"
        :class="{ 'is-visible': showControls }"
      >
        <!-- Skip back -->
        <div
          v-show="videoList.length > 1"
          class="guo-skip-back"
          @pointerdown="back"
        >
          <IconSkipBack :size="20" color="#f3f4f6" />
        </div>

        <!-- Play / Pause -->
        <div class="guo-play" @pointerdown="playOrPause">
          <IconPlay v-show="paused" :size="20" color="#f3f4f6" />
          <IconPause v-show="!paused" :size="20" color="#f3f4f6" />
        </div>

        <!-- Skip forward -->
        <div
          v-show="videoList.length > 1"
          class="guo-skip-forward"
          @pointerdown="forward"
        >
          <IconSkipForward :size="20" color="#f3f4f6" />
        </div>

        <!-- Current time -->
        <div class="guo-current-time">
          {{ currentTime }}
        </div>

        <!-- Progress bar -->
        <div class="guo-progress">
          <div
            ref="progressRef"
            class="guo-progress-bar"
            @pointerdown.stop="onThumbPointerDown"
            @pointermove.stop="onThumbPointerMove"
            @pointerup.stop="onThumbPointerUp"
          >
            <!-- Thumb -->
            <div
              ref="thumbRef"
              class="guo-progress-thumb"
              :style="{ left: '0%' }"
            />
            <!-- Seek click overlay -->
            <div class="guo-progress-bar-seek" @pointerdown="onProgressClick" />
            <!-- Playback progress -->
            <div
              class="guo-progress-bar-current"
              :style="{ width: `${playPercentage * 100}%` }"
            />
            <!-- Buffer progress -->
            <div
              class="guo-progress-bar-buffer"
              :style="{ width: `${bufferPercentage * 100}%` }"
            />
          </div>
        </div>

        <!-- Duration -->
        <div class="guo-time">
          {{ duration }}
        </div>

        <!-- Volume -->
        <div class="guo-volume">
          <div class="guo-volume-icon">
            <IconVolumeMute
              v-show="initVolume === 0 || videoMuted"
              :size="20"
              color="#f3f4f6"
              @click="toggleMute"
            />
            <IconVolumeDown
              v-show="initVolume > 0 && initVolume <= 0.5 && !videoMuted"
              :size="20"
              color="#f3f4f6"
              @click="toggleMute"
            />
            <IconVolumeUp
              v-show="initVolume > 0.5 && !videoMuted"
              :size="20"
              color="#f3f4f6"
              @click="toggleMute"
            />
          </div>
          <div class="guo-volume-slider-wrap">
            <input
              type="range"
              class="guo-volume-bar"
              min="0"
              max="1"
              step="0.01"
              :value="initVolume"
              @input="onVolumeChange"
            >
          </div>
        </div>

        <!-- Quality menu -->
        <div v-if="currentQuality" class="guo-quality">
          <div class="guo-quality-current">
            {{ currentQuality.label }}
          </div>
          <div class="guo-quality-menu">
            <div
              v-for="item in qualityList"
              :key="item.label"
              class="guo-quality-item"
              :class="{ 'is-active': currentQuality.label === item.label }"
              @pointerdown="toggleQuality(item)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>

        <!-- Subtitles button -->
        <div
          v-if="subtitlesButton && currentVideo.subtitles?.length > 0"
          class="guo-subtitles-btn"
        >
          <div @pointerdown="toggleSubtitlesVisible(!isShowSubtitles)">
            <IconSubtitles
              v-show="isShowSubtitles"
              :size="20"
              color="#f3f4f6"
            />
            <IconSubtitlesOff
              v-show="!isShowSubtitles"
              :size="20"
              color="#f3f4f6"
            />
          </div>
          <div class="guo-subtitles-menu">
            <!-- Double subtitle toggle -->
            <div
              v-if="currentVideo.subtitles.length >= 2"
              class="guo-double-subtitle-row"
            >
              <span>双语</span>
              <label class="guo-toggle">
                <input
                  type="checkbox"
                  :checked="doubleSubtitle"
                  @change="toggleDoubleSubtitle"
                >
                <span class="guo-toggle-track">
                  <span class="guo-toggle-thumb" />
                </span>
              </label>
            </div>

            <!-- Subtitle columns -->
            <div
              class="guo-subtitles-menu-inner"
              :class="{
                'is-double': doubleSubtitle,
                'is-single':
                  !doubleSubtitle && currentVideo.subtitles.length >= 2,
                'is-minimal': currentVideo.subtitles.length < 2,
              }"
            >
              <!-- Primary column -->
              <div class="guo-subtitles-col">
                <div
                  class="guo-subtitles-col-label"
                  :class="{ 'is-hidden': !doubleSubtitle }"
                >
                  主字幕
                </div>
                <div
                  v-for="item in currentVideo.subtitles"
                  :key="item.lang"
                  class="guo-subtitles-item"
                  :class="{ 'is-active': item.lang === primarySubtitle?.lang }"
                  @pointerdown="applySubtitle(item, 'primary')"
                >
                  {{ item.label }}
                </div>
              </div>

              <!-- Secondary column (animated) -->
              <Transition
                enter-active-class="guo-slide-enter-active"
                leave-active-class="guo-slide-leave-active"
                enter-from-class="guo-slide-enter-from"
                leave-to-class="guo-slide-leave-to"
              >
                <div v-show="doubleSubtitle" class="guo-subtitles-col">
                  <div class="guo-subtitles-col-label">
                    副字幕
                  </div>
                  <div
                    v-for="item in currentVideo.subtitles"
                    :key="item.lang"
                    class="guo-subtitles-item"
                    :class="{
                      'is-active': item.lang === secondarySubtitle?.lang,
                    }"
                    @pointerdown="applySubtitle(item, 'secondary')"
                  >
                    {{ item.label }}
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Picture-in-Picture -->
        <div class="guo-picture-in-picture" @pointerdown.stop="togglePiP">
          <IconPiP v-show="!isPictureInPicture" :size="20" color="#f3f4f6" />
          <IconPiPExit v-show="isPictureInPicture" :size="20" color="#f3f4f6" />
        </div>

        <!-- Fullscreen -->
        <div class="guo-fullscreen" @pointerdown.stop="toggleFullscreen">
          <IconFullscreen v-show="!isFullscreen" :size="20" color="#f3f4f6" />
          <IconFullscreenExit
            v-show="isFullscreen"
            :size="20"
            color="#f3f4f6"
          />
        </div>
      </div>
    </div>
  </div>
</template>
