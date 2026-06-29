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

/** 提交视频生成任务 */
export const generateVideo = (prompt: string, model: string, imageUrl?: string, uploadFileId?: string) => {
  return post<VideoGenerateResponse>('/video-generate', {
    body: { prompt, model, image_url: imageUrl, upload_file_id: uploadFileId },
  }, { silent: true })
}

/** 轮询视频生成任务状态 */
export const pollVideoTask = (taskId: string) => {
  return get<VideoTaskStatusResponse>(`/video-task/${taskId}`)
}

