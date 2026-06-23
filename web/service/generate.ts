import { post } from './base'

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
