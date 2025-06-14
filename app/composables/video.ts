import type { MediaPlayerClass, Representation, StreamInitializedEvent } from 'dashjs'
import type { Level } from 'hls.js'
import type Hls from 'hls.js'
import type { Quality, VideoOptions } from '~/types'

type PlayerType = MediaPlayerClass | null | Hls

interface videoState {
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
  representation?: Representation[] | Level[]
  currentRepresentation?: Representation | null | Level
  qualityList: Array<Quality>
  currentQuality: Quality | null
  player: PlayerType
  type: string | null
  src: string
  options: VideoOptions
  loaded: boolean
}

enum QUALITY {
  '自动' = -1,
  '流畅' = 480,
  '高清' = 720,
  '超清' = 1080,
  '4K' = 2160,
}

export class GuoPlayer {
  private video: HTMLVideoElement
  state = reactive<videoState>(
    {
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
    },
  )

  constructor(video: HTMLVideoElement, src: string, type: string, options: VideoOptions) {
    this.video = video
    this.state.src = src
    this.state.type = type
    this.state.options = options
    if (options.muted) {
      this.video.muted = true
    }
    this.init(video, src, type)
  }

  private init(video: HTMLVideoElement, src: string, type: string) {
    if (type === 'm3u8') {
      this.hls(src)
    }
    if (type === 'mpd') {
      this.dash(src)
    }
    if (type === 'flv') {
      this.flv(src)
    }
    if (type === 'mp4') {
      this.mp4(src)
    }
    this.initVideoEvent()
  }

  private initVideoEvent() {
    this.video.addEventListener('canplay', () => {
      if (this.state.options.autoplay === false) {
        this.state.loaded = true
        this.state.paused = true
      }
      else {
        this.state.paused = false
      }
      // console.log('canplay')
      this.state.canplay = true
    })
    this.video.addEventListener('waiting', () => {
      // console.log('waiting')
      this.state.canplay = false
      this.state.paused = true
    })
    this.video.addEventListener('timeupdate', () => {
      this.state.currentTime = this.video.currentTime * 1000
      this.state.playPercentage = this.state.currentTime / this.state.duration
    })
    this.video.addEventListener('pause', () => {
      // console.log('pause')
    })
    this.video.addEventListener('play', () => {
      // console.log('play')
    })
    this.video.addEventListener('playing', () => {
      // console.log('playing初次播放，暂停后恢复或结束后重新开始')
      this.state.paused = false
    })
    this.video.addEventListener('abort', () => {
      // console.log('abort 在播放被终止时触发，比如当播放中的视频重新开始播放时')
    })
    this.video.addEventListener('ended', () => {
      // console.log('paused')
      this.state.paused = true
    })
    this.video.addEventListener('progress', () => {
      this.state.bufferPercentage = this.video.buffered.length ? this.video.buffered.end(this.video.buffered.length - 1) / this.video.duration : 0
    })
    this.video.addEventListener('loadedmetadata', () => {
      this.state.duration = this.video.duration * 1000
    })
    this.video.addEventListener('error', () => {
      this.state.error = true
    })
  }

  private hls(src: string) {
    const Hls = useNuxtApp().$Hls
    if (Hls.isSupported()) {
      const hls = this.state.player = new Hls(
        {
          startLevel: -1,
        },
      )
      hls.loadSource(src)
      hls.attachMedia(this.video)
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        hls.once(Hls.Events.LEVEL_SWITCHED, async (_, currentData) => {
          // 你可以在这里执行切换完成后的逻辑
          const currentLevel = currentData.level
          const levels = data.levels
          levels.forEach((item, index) => {
            if (QUALITY[item.height]) {
              const obj: Quality = {
                label: QUALITY[item.height] as string,
                representation: item,
              }
              this.state.qualityList.push(obj)
              if (currentLevel === index) {
                this.state.currentQuality = obj
                this.state.currentRepresentation = item
              }
            }
          })
          // this.state.qualityList.push({
          //   label: QUALITY[-1] as string
          // })
          this.state.qualityList = this.state.qualityList.sort((a, b) => {
            const aKey = a.label as keyof typeof QUALITY
            const bKey = b.label as keyof typeof QUALITY
            return QUALITY[bKey] - QUALITY[aKey]
          })
          if (currentLevel === -1) {
            this.state.currentQuality = this.state.qualityList[length]!
            this.state.currentRepresentation = null
          }
          if (this.state.options.autoplay) {
            await this.video.play()
          }
        })
      })
    }
    else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = src
      if (this.state.options.autoplay) {
        await this.video.play()
      }
    }
  }

  private dash(src: string) {
    const dash = useNuxtApp().$dash
    const video = this.video
    const player = this.state.player = dash
      .MediaPlayer()
      .create()
    player.initialize(
      video,
      src,
      this.state.options.autoplay, // 自动播放
    )
    player.updateSettings({
      streaming: {
        abr: {
          autoSwitchBitrate: {
            video: false, // 自动切换视频清晰度
            audio: false, // 自动切换音频清晰度
          },
        },
        buffer: {
          flushBufferAtTrackSwitch: true,

          // When enabled, after a track switch and in case buffer is being replaced, the video element is flushed (seek at current playback time) once a segment of the new track is appended in buffer in order to force video decoder to play new track.
          // 当启用时，在轨道切换后以及缓冲区正在被替换的情况下，每当新轨道的一段被追加到缓冲区中时，视频元素会刷新（在当前播放时间处进行定位），以强制视频解码器播放新轨道。

          // This can be required on some devices like GoogleCast devices to make track switching functional.
          // 在某些设备上，如 GoogleCast 设备，可能需要这样做才能使轨道切换功能正常工作。

          // Otherwise, track switching will be effective only once after previous buffered track is fully consumed.
          // 否则，轨道切换只有在之前的缓冲轨道完全被消耗后才会生效一次。
          fastSwitchEnabled: true, // 开启快速切换 segment（重点！）
        },
      },
    })
    const getQuality = () => {
      this.state.representation = player.getRepresentationsByType('video')
      this.state.currentRepresentation = player.getCurrentRepresentationForType('video')
      this.state.qualityList = []
      for (const item of this.state.representation) {
        if (QUALITY[item.height]) {
          const obj: Quality = {
            label: QUALITY[item.height] as string,
            representation: item,
          }
          this.state.qualityList.push(obj)
          if (item.id === this.state.currentRepresentation?.id) {
            this.state.currentQuality = obj
          }
        }
      }
      // this.state.qualityList.push({
      //   label: QUALITY[-1] as string
      // })
      this.state.qualityList = this.state.qualityList.sort((a, b) => {
        const aKey = a.label as keyof typeof QUALITY
        const bKey = b.label as keyof typeof QUALITY
        return QUALITY[bKey] - QUALITY[aKey]
      })
      // player.off(dash.MediaPlayer.events.STREAM_INITIALIZED, getQuality)
    }
    player.on(dash.MediaPlayer.events.STREAM_INITIALIZED, getQuality)

    // 监听画质切换完成事件，只监听一次
    // this.state.player.on(dash.MediaPlayer.events.QUALITY_CHANGE_RENDERED, () => {
    //   console.log('清晰度切换完成')
    // })
    // this.state.player.on(dash.MediaPlayer.events.QUALITY_CHANGE_REQUESTED, () => {
    //   console.log('清晰度切换请求')
    // })
  }

  private async flv(src: string) {
    const flvjs = useNuxtApp().$flvjs
    if (flvjs.isSupported()) {
      const videoElement = this.video
      const flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: src,
      })
      flvPlayer.attachMediaElement(videoElement)
      flvPlayer.load()
      if (this.state.options.autoplay) {
        await flvPlayer.play()
      }
    }
  }

  private mp4(src: string) {
    this.video.src = src
    if (this.state.options.autoplay) {
      this.video.autoplay = true
    }
  }

  src(newSrc: string, type: string) {
    this.state.canplay = false
    this.state.qualityList = []
    this.state.currentQuality = null
    if (type !== this.state.type) {
      if (this.state.player) {
        if (this.state.type === 'mpd') {
          (this.state.player as MediaPlayerClass).reset()
        }
        this.state.player = null
      }
      this.state.type = type
      if (type == 'mpd') {
        if (this.state.player) {
          (this.state.player as Hls)?.destroy()
        }
        this.dash(newSrc)
      }
      else if (type === 'm3u8') {
        if (this.state.player) {
          (this.state.player as MediaPlayerClass).reset()
        }
        this.hls(newSrc)
      }
    }
    else {
      if (type === 'mpd') {
        (this.state.player as MediaPlayerClass)?.attachSource(newSrc)
      }
      else if (type === 'm3u8') {
        this.state.player?.destroy()
        this.hls(newSrc)
      }
    }
    if (type === 'mp4') {
      this.mp4(newSrc)
    }
  }

  play() {
    this.state.loaded = false
    const playPromse = this.video.play()
    if (playPromse) {
      playPromse.catch((err) => {
        console.error(`尝试播放视频发生错误：${err.message}（${err.name}）`)
        this.pause()
      })
    }
    this.state.paused = false
  }

  pause() {
    this.video.pause()
    this.state.paused = true
  }

  muted() {
    this.video.muted = true
  }

  volumeChange(volume: number) {
    this.video.muted = true
    this.toggleMuted()
    this.state.volume = this.video.volume = volume
  }

  toggleMuted() {
    if (this.video.muted) {
      this.state.options.muted = this.video.muted = false
    }
    else {
      this.state.options.muted = this.video.muted = true
    }
  }

  timeChange(time: number) {
    this.video.currentTime = time / 1000 // 转换为秒
    this.state.currentTime = time
  }

  rateChange(rate: number) {
    this.video.playbackRate = rate
  }

  pictureInPicture() {
    if ('documentPictureInPicture' in window) {
      this.video.requestPictureInPicture().then(() => {
        this.state.isPictureInPicture = true
        const cb = () => {
          // 在这里可以添加自定义的退出逻辑
          this.state.isPictureInPicture = false
          this.video.removeEventListener('leavepictureinpicture', cb)
        }
        // 监听退出画中画模式事件
        this.video.addEventListener('leavepictureinpicture', cb)
      }).catch((err) => {
        console.error(`尝试切换到画中画模式时发生错误：${err.message}（${err.name}）`)
      })
    }
  }

  exitPictureInPicture() {
    if (document.exitPictureInPicture && document.pictureInPictureElement) {
      document.exitPictureInPicture().then(() => {
        this.state.isPictureInPicture = false
      }).catch((err) => {
        console.error(`尝试退出画中画模式时发生错误：${err.message}（${err.name}）`)
      })
    }
  }

  fullScreen(playerRef: HTMLDivElement) {
    if (playerRef.requestFullscreen) {
      playerRef.requestFullscreen().then(() => {
        this.state.isFullscreen = true
        const cb = () => {
          if (!document.fullscreenElement) {
            this.state.isFullscreen = false
            document.removeEventListener('fullscreenchange', cb)
          }
        }
        document.addEventListener('fullscreenchange', cb)
      }).catch((err) => {
        console.error(`尝试切换到全屏模式时发生错误：${err.message}（${err.name}）`)
      })
    }
  }

  exitFullScreen() {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        this.state.isFullscreen = false
      }).catch((err) => {
        console.error(`尝试退出全屏模式时发生错误：${err.message}（${err.name}）`)
      })
    }
  }

  async toggleQuality(item: Quality) {
    if (!this.state.representation)
      return
    if (this.state.type === 'm3u8') {
      const Hls = useNuxtApp().$Hls
      const player = this.state.player as Hls
      let targetLevelIndex = null
      if (QUALITY[item.label as keyof typeof QUALITY] === -1) {
        targetLevelIndex = -1
      }
      else {
        targetLevelIndex = player.levels.findIndex(level => level.height === item.representation!.height)
      }
      this.video.pause()
      this.state.canplay = false
      player.currentLevel = targetLevelIndex
      const currentTime = this.video.currentTime
      player.once(Hls.Events.LEVEL_SWITCHED, async() => {
        // 你可以在这里执行切换完成后的逻辑
        this.video.currentTime = currentTime // 定位到原时间点
        await this.video.play()
        this.state.canplay = true
      })
    }
    if (this.state.type === 'mpd') {
      const dash = useNuxtApp().$dash
      const player = this.state.player as MediaPlayerClass
      player.setRepresentationForTypeByIndex('video', (item.representation as Representation).index, true)
      player.on(dash.MediaPlayer.events.QUALITY_CHANGE_RENDERED, () => {
        // console.log('清晰度切换完成')
      })
    }
    this.state.currentQuality = item
  }

  screenshot() {
    const canvas: HTMLCanvasElement = document.createElement('canvas')
    canvas.width = this.video.videoWidth
    canvas.height = this.video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx!.drawImage(this.video, 0, 0, canvas.width, canvas.height)
    const fileName = `${this.video.currentTime}.png`
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  destroy() {
    // console.log("销毁了")
  }
}

// get Muted(): boolean {
//   return this.video.defaultMuted;
// }
// get rate(): number {
//   return this.video.defaultPlaybackRate;
// }
// get readyState(): number {
//   //  0 没有信息，视频未准备好
//   //  1 视频元数据已准备
//   //  2 视频当前位置数据可用，但是下一帧数据没有
//   //  3 当前和至少下一帧数据可用
//   //  4 有足够的数据可以播放
//   return this.video.readyState;
// }
// get networkState(): number {
//   //  0 还没初始化
//   //  1 处于活跃状态，但还没使用网络
//   //  2 浏览器在下载数据
//   //  3 没有找到数据源
//   return this.video.networkState;
// }
