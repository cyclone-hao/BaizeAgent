import { get, post } from './base'

export type ImageGenerateResponse = {
  images: string[]
  task_id: string
  prompt: string
}

export const generateImage = (prompt: string, size = '1024*1024', n = 1) => {
  return post<ImageGenerateResponse>('/image-generate', {
    body: { prompt, size, n },
  }, { silent: true })
}

// ── Video Generation ──

export type VideoModel = {
  id: string
  name: string
  t2v: string
  i2v: string
}

export const VIDEO_MODELS: VideoModel[] = [
  { id: 'wan2.7', name: '万相 2.7', t2v: 'wan2.7-t2v', i2v: 'wan2.7-i2v' },
  { id: 'happyhorse-1.0', name: 'HappyHorse', t2v: 'happyhorse-1.0-t2v', i2v: 'happyhorse-1.0-i2v' },
]

export type VideoGenerateResponse = {
  task_id: string
  status: string
  prompt: string
  model: string
}

export type VideoTaskStatusResponse = {
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN'
  video_url?: string
  message?: string
}

export type VideoGenerateParams = {
  prompt: string
  model: string
  imageUrl?: string
  uploadFileId?: string
  firstFrameFileId?: string
  lastFrameFileId?: string
  resolution?: string   // "480P" | "720P" | "1080P"
  duration?: number     // 1-10
  ratio?: string        // "16:9" | "9:16" | "1:1" | "4:3" | "3:4"
  promptExtend?: boolean
}

/** 提交视频生成任务 */
export const generateVideo = (params: VideoGenerateParams) => {
  return post<VideoGenerateResponse>('/video-generate', {
    body: {
      prompt: params.prompt,
      model: params.model,
      image_url: params.imageUrl,
      upload_file_id: params.uploadFileId,
      first_frame_file_id: params.firstFrameFileId,
      last_frame_file_id: params.lastFrameFileId,
      resolution: params.resolution,
      duration: params.duration,
      ratio: params.ratio,
      prompt_extend: params.promptExtend,
    },
  }, { silent: true })
}

/** 轮询视频生成任务状态 */
export const pollVideoTask = (taskId: string) => {
  return get<VideoTaskStatusResponse>(`/video-task/${taskId}`)
}

