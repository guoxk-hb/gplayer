import type { Quality, VideoOptions } from '../types'
import { reactive } from 'vue'

// ---------------------------------------------------------------------------
// Quality enum (internal, not exported – labels are user-facing strings)
// ---------------------------------------------------------------------------
enum QUALITY {
  '自动' = -1,
  '流畅' = 480,
  '高清' = 720,
  '超清' = 1080,
  '4K' = 2160,
}

// ---------------------------------------------------------------------------
// Internal state shape
// ---------------------------------------------------------------------------
interface PlayerState {
  paused: boolean
  canplay: boolean
  currentTime: number
  duration: number
  volume: number
  bufferPercentage: number
  playPercentage: number
  isFullscreen: boolean
  isPictureInPicture: boolean
  error: boolean
  /** Raw representation list from hls.js / dashjs (kept as unknown to avoid hard deps) */
  representation?: unknown[]
  currentRepresentation?: unknown
  qualityList: Quality[]
  currentQuality: Quality | null
  /** The underlying hls / dash / flv player instance */
  player: unknown
  type: string | null
  src: string
  options: VideoOptions
  loaded: boolean
}

// ---------------------------------------------------------------------------
// GuoPlayer
// ---------------------------------------------------------------------------
export class GuoPlayer {
  private video: HTMLVideoElement
  private _hasEverPlayed = false
  state = reactive<PlayerState>({
    paused: true,
    canplay: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    bufferPercentage: 0,
    playPercentage: 0,
    isFullscreen: false,
    isPictureInPicture: false,
    error: false,
    qualityList: [],
    currentQuality: null,
    player: null,
    type: null,
    src: '',
    loaded: false,
    options: {
      autoplay: false,
      muted: false,
      loop: false,
      preload: 'auto',
    },
  })

  constructor(
    video: HTMLVideoElement,
    src: string,
    type: string,
    options: VideoOptions,
  ) {
    this.video = video
    this.state.src = src
    this.state.type = type
    this.state.options = options
    if (options.muted) {
      this.video.muted = true
    }
    this.init(src, type)
  }

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  private init(src: string, type: string) {
    if (type === 'm3u8')
      this.hls(src)
    else if (type === 'mpd')
      this.dash(src)
    else if (type === 'flv')
      this.flv(src)
    else if (type === 'mp4')
      this.mp4(src)
    this.initVideoEvents()
  }

  private initVideoEvents() {
    const v = this.video

    v.addEventListener('canplay', () => {
      if (!this._hasEverPlayed) {
        this.state.loaded = true
      }
      this.state.canplay = true
    })

    v.addEventListener('waiting', () => {
      this.state.canplay = false
    })

    v.addEventListener('timeupdate', () => {
      this.state.currentTime = v.currentTime * 1000
      this.state.playPercentage = this.state.duration
        ? this.state.currentTime / this.state.duration
        : 0
    })

    v.addEventListener('play', () => {
      this._hasEverPlayed = true
      this.state.loaded = false
      this.state.paused = false
    })

    v.addEventListener('pause', () => {
      this.state.paused = true
    })

    v.addEventListener('playing', () => {
      this.state.canplay = true
      this.state.paused = false
    })

    v.addEventListener('ended', () => {
      this.state.paused = true
    })

    v.addEventListener('progress', () => {
      this.state.bufferPercentage = v.buffered.length
        ? v.buffered.end(v.buffered.length - 1) / v.duration
        : 0
    })

    v.addEventListener('loadedmetadata', () => {
      this.state.duration = v.duration * 1000
    })

    v.addEventListener('error', () => {
      this.state.error = true
    })
  }

  // -------------------------------------------------------------------------
  // HLS (hls.js) – dynamically imported to keep it optional
  // -------------------------------------------------------------------------
  private async hls(src: string) {
    let HlsLib: typeof import('hls.js').default
    try {
      HlsLib = (await import('hls.js')).default
    }
    catch {
      console.error(
        '[GPlayer] hls.js is not installed. Run: npm install hls.js',
      )
      return
    }

    if (HlsLib.isSupported()) {
      const hls = new HlsLib({ startLevel: -1 })
      this.state.player = hls
      hls.loadSource(src)
      hls.attachMedia(this.video)

      hls.on(HlsLib.Events.MANIFEST_PARSED, (_event, data) => {
        hls.once(HlsLib.Events.LEVEL_SWITCHED, async (_, currentData) => {
          const currentLevel = currentData.level
          const levels = data.levels
          this.state.representation = levels

          const list: Quality[] = []
          levels.forEach((item, index) => {
            const label
              = QUALITY[item.height as unknown as keyof typeof QUALITY]
            if (label) {
              const obj: Quality = {
                label: String(label),
                representation: item,
              }
              list.push(obj)
              if (currentLevel === index) {
                this.state.currentQuality = obj
                this.state.currentRepresentation = item
              }
            }
          })

          this.state.qualityList = list.sort(
            (a, b) =>
              QUALITY[b.label as keyof typeof QUALITY]
              - QUALITY[a.label as keyof typeof QUALITY],
          )

          if (this.state.options.autoplay) {
            await this.video.play()
          }
        })
      })
    }
    else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      this.video.src = src
      if (this.state.options.autoplay) {
        await this.video.play()
      }
    }
  }

  // -------------------------------------------------------------------------
  // DASH (dashjs) – dynamically imported to keep it optional
  // -------------------------------------------------------------------------
  private async dash(src: string) {
    let dashjs: typeof import('dashjs')
    try {
      dashjs = await import('dashjs')
    }
    catch {
      console.error(
        '[GPlayer] dashjs is not installed. Run: npm install dashjs',
      )
      return
    }

    const player = dashjs.MediaPlayer().create()
    this.state.player = player
    player.initialize(this.video, src, this.state.options.autoplay)
    player.updateSettings({
      streaming: {
        abr: {
          autoSwitchBitrate: { video: false, audio: false },
        },
        buffer: {
          flushBufferAtTrackSwitch: true,
          fastSwitchEnabled: true,
        },
      },
    })

    const buildQualityList = () => {
      const reps = player.getRepresentationsByType('video') as Array<{
        height: number
        index: number
        id: string
      }>
      const current = player.getCurrentRepresentationForType('video') as {
        id: string
      } | null
      this.state.representation = reps
      this.state.currentRepresentation = current

      const list: Quality[] = []
      for (const item of reps) {
        const label = QUALITY[item.height as unknown as keyof typeof QUALITY]
        if (label) {
          const obj: Quality = { label: String(label), representation: item }
          list.push(obj)
          if (item.id === current?.id) {
            this.state.currentQuality = obj
          }
        }
      }
      this.state.qualityList = list.sort(
        (a, b) =>
          QUALITY[b.label as keyof typeof QUALITY]
          - QUALITY[a.label as keyof typeof QUALITY],
      )
    }

    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, buildQualityList)
  }

  // -------------------------------------------------------------------------
  // FLV (flv.js) – dynamically imported to keep it optional
  // -------------------------------------------------------------------------
  private async flv(src: string) {
    let flvjs: typeof import('flv.js').default
    try {
      flvjs = (await import('flv.js')).default
    }
    catch {
      console.error(
        '[GPlayer] flv.js is not installed. Run: npm install flv.js',
      )
      return
    }

    if (flvjs.isSupported()) {
      const flvPlayer = flvjs.createPlayer({ type: 'flv', url: src })
      this.state.player = flvPlayer
      flvPlayer.attachMediaElement(this.video)
      flvPlayer.load()
      if (this.state.options.autoplay) {
        await flvPlayer.play()
      }
    }
  }

  // -------------------------------------------------------------------------
  // MP4 – native
  // -------------------------------------------------------------------------
  private mp4(src: string) {
    this.video.src = src
    if (this.state.options.autoplay) {
      this.video.autoplay = true
    }
  }

  // -------------------------------------------------------------------------
  // Source switching (e.g. playlist next/prev)
  // -------------------------------------------------------------------------
  src(newSrc: string, type: string) {
    this._hasEverPlayed = false
    this.state.canplay = false
    this.state.qualityList = []
    this.state.currentQuality = null

    if (type !== this.state.type) {
      // type changed – destroy old player first
      this.destroyInternalPlayer()
      this.state.type = type
      this.initByType(newSrc, type)
    }
    else {
      // same type – reuse or reinit
      if (type === 'mpd') {
        const p = this.state.player as {
          attachSource: (s: string) => void
        } | null
        p?.attachSource(newSrc)
      }
      else if (type === 'm3u8') {
        const p = this.state.player as { destroy: () => void } | null
        p?.destroy()
        this.hls(newSrc)
      }
      else if (type === 'mp4') {
        this.mp4(newSrc)
      }
      else if (type === 'flv') {
        const p = this.state.player as { destroy: () => void } | null
        p?.destroy()
        this.flv(newSrc)
      }
    }
  }

  private initByType(src: string, type: string) {
    if (type === 'mpd')
      this.dash(src)
    else if (type === 'm3u8')
      this.hls(src)
    else if (type === 'flv')
      this.flv(src)
    else this.mp4(src)
  }

  private destroyInternalPlayer() {
    const p = this.state.player as {
      destroy?: () => void
      reset?: () => void
    } | null
    if (!p)
      return
    if (this.state.type === 'mpd')
      p.reset?.()
    else p.destroy?.()
    this.state.player = null
  }

  // -------------------------------------------------------------------------
  // Playback controls
  // -------------------------------------------------------------------------
  play() {
    this._hasEverPlayed = true
    this.state.loaded = false
    const promise = this.video.play()
    if (promise) {
      promise.catch((err: Error) => {
        console.error(`[GPlayer] play error: ${err.message} (${err.name})`)
        this.pause()
      })
    }
    this.state.paused = false
  }

  pause() {
    this.video.pause()
    this.state.paused = true
  }

  volumeChange(volume: number) {
    // Unmute when user adjusts volume
    this.video.muted = false
    this.state.options.muted = false
    this.state.volume = this.video.volume = volume
  }

  toggleMuted() {
    const next = !this.video.muted
    this.state.options.muted = this.video.muted = next
  }

  timeChange(time: number) {
    this.video.currentTime = time / 1000
    this.state.currentTime = time
  }

  rateChange(rate: number) {
    this.video.playbackRate = rate
  }

  // -------------------------------------------------------------------------
  // Quality switching
  // -------------------------------------------------------------------------
  async toggleQuality(item: Quality) {
    if (!this.state.representation)
      return

    if (this.state.type === 'm3u8') {
      const player = this.state.player as {
        levels: Array<{ height: number }>
        currentLevel: number
        once: (event: string, cb: () => void) => void
      } | null
      if (!player)
        return

      let HlsLib: typeof import('hls.js').default
      try {
        HlsLib = (await import('hls.js')).default
      }
      catch {
        return
      }

      const rep = item.representation as { height: number } | undefined
      const targetIndex
        = QUALITY[item.label as keyof typeof QUALITY] === -1
          ? -1
          : player.levels.findIndex(l => l.height === rep?.height)

      player.currentLevel = targetIndex
      const currentTime = this.video.currentTime

      player.once(HlsLib.Events.LEVEL_SWITCHED, () => {
        this.video.currentTime = currentTime
        this.state.canplay = true
        if (!this.state.paused) {
          this.state.paused = false
        }
      })
    }

    if (this.state.type === 'mpd') {
      let dashjs: typeof import('dashjs')
      try {
        dashjs = await import('dashjs')
      }
      catch {
        return
      }
      const player = this.state.player as {
        setRepresentationForTypeByIndex: (
          type: string,
          index: number,
          force: boolean,
        ) => void
        on: (event: string, cb: () => void) => void
      } | null
      if (!player)
        return

      const rep = item.representation as { index: number } | undefined
      if (rep !== undefined) {
        player.setRepresentationForTypeByIndex('video', rep.index, true)
        player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, () => {})
      }
    }

    this.state.currentQuality = item
  }

  // -------------------------------------------------------------------------
  // Fullscreen
  // -------------------------------------------------------------------------
  fullScreen(playerEl: HTMLDivElement) {
    playerEl
      .requestFullscreen()
      .then(() => {
        this.state.isFullscreen = true
        const onFsChange = () => {
          if (!document.fullscreenElement) {
            this.state.isFullscreen = false
            document.removeEventListener('fullscreenchange', onFsChange)
          }
        }
        document.addEventListener('fullscreenchange', onFsChange)
      })
      .catch((err: Error) => {
        console.error(`[GPlayer] fullscreen error: ${err.message}`)
      })
  }

  exitFullScreen() {
    if (document.exitFullscreen && document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => {
          this.state.isFullscreen = false
        })
        .catch((err: Error) => {
          console.error(`[GPlayer] exitFullscreen error: ${err.message}`)
        })
    }
  }

  // -------------------------------------------------------------------------
  // Picture-in-Picture
  // -------------------------------------------------------------------------
  pictureInPicture() {
    this.video
      .requestPictureInPicture()
      .then(() => {
        this.state.isPictureInPicture = true
        const onLeave = () => {
          this.state.isPictureInPicture = false
          this.video.removeEventListener('leavepictureinpicture', onLeave)
        }
        this.video.addEventListener('leavepictureinpicture', onLeave)
      })
      .catch((err: Error) => {
        console.error(`[GPlayer] PiP error: ${err.message}`)
      })
  }

  exitPictureInPicture() {
    if (document.exitPictureInPicture && document.pictureInPictureElement) {
      document
        .exitPictureInPicture()
        .then(() => {
          this.state.isPictureInPicture = false
        })
        .catch((err: Error) => {
          console.error(`[GPlayer] exitPiP error: ${err.message}`)
        })
    }
  }

  // -------------------------------------------------------------------------
  // Screenshot
  // -------------------------------------------------------------------------
  screenshot() {
    const canvas = document.createElement('canvas')
    canvas.width = this.video.videoWidth
    canvas.height = this.video.videoHeight
    canvas.getContext('2d')!.drawImage(this.video, 0, 0)
    const fileName = `${this.video.currentTime}.png`
    canvas.toBlob((blob) => {
      if (!blob)
        return
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: fileName,
        style: 'display:none',
      })
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  // -------------------------------------------------------------------------
  // Destroy
  // -------------------------------------------------------------------------
  destroy() {
    this.destroyInternalPlayer()
    this.video.src = ''
    this.video.load()
  }
}
