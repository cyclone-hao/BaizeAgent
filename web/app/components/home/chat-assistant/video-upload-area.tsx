'use client'

import { useCallback, useRef, useState } from 'react'
import { RiCloseLine, RiImageAddLine, RiLoader4Line } from '@remixicon/react'
import cn from '@/utils/classnames'
import { fileUpload } from '@/app/components/base/file-uploader/utils'

// ── Types ──────────────────────────────────────────

export type VideoFrameFile = {
  file: File
  previewUrl: string
  uploadFileId: string
  status: 'uploading' | 'done' | 'error'
  error?: string
}

type VideoUploadAreaProps = {
  firstFrame: VideoFrameFile | null
  lastFrame: VideoFrameFile | null
  onFirstFrameChange: (file: VideoFrameFile | null) => void
  onLastFrameChange: (file: VideoFrameFile | null) => void
  disabled?: boolean
  /** Whether the selected video model supports last frame (尾帧) */
  supportsLastFrame?: boolean
}

// ── Helpers ────────────────────────────────────────

const ACCEPT_IMAGE = 'image/jpeg,image/png,image/gif,image/webp,image/bmp'

const isImageFile = (file: File) => file.type.startsWith('image/')

async function uploadImageFile(file: File): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    fileUpload({
      file,
      onProgressCallback: () => { /* noop */ },
      onSuccessCallback: (res: { id: string }) => resolve(res),
      onErrorCallback: () => reject(new Error('图片上传失败')),
    })
  })
}

// ── Frame Slot Component ───────────────────────────

const FrameSlot = ({
  label,
  description,
  frame,
  onChange,
  disabled,
}: {
  label: string
  description: string
  frame: VideoFrameFile | null
  onChange: (file: VideoFrameFile | null) => void
  disabled?: boolean
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!isImageFile(file))
      return

    const previewUrl = URL.createObjectURL(file)
    const frameFile: VideoFrameFile = {
      file,
      previewUrl,
      uploadFileId: '',
      status: 'uploading',
    }
    onChange(frameFile)

    try {
      const result = await uploadImageFile(file)
      onChange({
        ...frameFile,
        uploadFileId: result.id,
        status: 'done',
      })
    }
    catch (err: any) {
      onChange({
        ...frameFile,
        status: 'error',
        error: err?.message || '上传失败',
      })
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [disabled, handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) handleFile(file)
  }, [handleFile])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (frame?.previewUrl)
      URL.revokeObjectURL(frame.previewUrl)
    onChange(null)
  }, [frame, onChange])

  // Has image (uploading, done, or error)
  if (frame) {
    return (
      <div className="relative flex-1">
        <div className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all',
          frame.status === 'done' && 'border-rose-200 shadow-sm shadow-rose-500/5',
          frame.status === 'uploading' && 'border-divider-regular',
          frame.status === 'error' && 'border-red-200',
        )}>
          {/* Preview Image */}
          <div className="relative h-[100px] w-full bg-gray-100">
            <img
              src={frame.previewUrl}
              alt={label}
              className={cn(
                'h-full w-full object-cover transition-opacity',
                frame.status === 'uploading' && 'opacity-50',
              )}
            />

            {/* Upload overlay */}
            {frame.status === 'uploading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/30">
                <RiLoader4Line className="h-5 w-5 animate-spin text-white" />
                <span className="text-xs font-medium text-white">上传中...</span>
              </div>
            )}

            {/* Error overlay */}
            {frame.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-500/30">
                <span className="text-xs text-white">⚠️ {frame.error || '上传失败'}</span>
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/90 transition-all hover:bg-black/80 hover:text-white"
              onClick={handleRemove}
            >
              <RiCloseLine className="h-3.5 w-3.5" />
            </button>

            {/* Done checkmark */}
            {frame.status === 'done' && (
              <div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <span className="text-[10px]">✓</span>
              </div>
            )}
          </div>

          {/* Label bar */}
          <div className="flex items-center gap-1.5 bg-rose-50/80 px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-rose-600">{label}</span>
            {frame.status === 'done' && (
              <span className="ml-auto text-[10px] text-rose-400">{frame.file.name}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Empty slot
  return (
    <div className="relative flex-1">
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-all duration-200',
          'h-[100px] w-full',
          isDragOver
            ? 'border-rose-400 bg-rose-50/50'
            : 'border-divider-regular bg-background-body hover:border-rose-300 hover:bg-rose-50/30',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          isDragOver ? 'bg-rose-100 text-rose-500' : 'bg-state-base-hover text-text-quaternary',
        )}>
          <RiImageAddLine className="h-4 w-4" />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-text-tertiary">{description}</p>
          <p className="mt-0.5 text-[10px] text-text-quaternary">拖拽或点击上传</p>
        </div>
      </div>

      {/* Label */}
      <div className="mt-1.5 text-center">
        <span className="text-[11px] font-medium text-text-tertiary">{label}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_IMAGE}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}

// ── Main Component ─────────────────────────────────

const VideoUploadArea = ({
  firstFrame,
  lastFrame,
  onFirstFrameChange,
  onLastFrameChange,
  disabled,
  supportsLastFrame = true,
}: VideoUploadAreaProps) => {
  return (
    <div className="px-4 pt-1.5">
      <div className="rounded-xl border border-components-panel-border bg-components-panel-on-panel-item-bg p-2.5">
        {/* Header */}
        <div className="mb-2.5 flex items-center gap-2">
          <span className="text-[13px] font-medium text-text-secondary">📷 参考图片</span>
          <span className="text-[11px] text-text-quaternary">（可选）</span>
        </div>

        {/* Frame slots */}
        <div className="flex gap-3">
          <FrameSlot
            label="首帧图"
            description="视频起始画面"
            frame={firstFrame}
            onChange={onFirstFrameChange}
            disabled={disabled}
          />
          {supportsLastFrame
            ? (
              <FrameSlot
                label="尾帧图"
                description="视频结束画面"
                frame={lastFrame}
                onChange={onLastFrameChange}
                disabled={disabled}
              />
            )
            : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-divider-regular bg-background-body/50 opacity-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-state-base-hover text-text-quaternary">
                  <RiImageAddLine className="h-4 w-4" />
                </div>
                <p className="mt-1 text-[11px] text-text-quaternary">当前模型不支持尾帧</p>
                <p className="text-[10px] text-text-quaternary">请切换万相 2.7</p>
              </div>
            )}
        </div>

        {/* Hint */}
        <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-rose-50/50 px-2.5 py-2">
          <span className="mt-0.5 text-xs">💡</span>
          <p className="text-[11px] leading-relaxed text-text-tertiary">
            {supportsLastFrame
              ? (
                <>
                  上传<span className="font-medium text-rose-500">首帧</span>图片即可进行图生视频。
                  同时上传<span className="font-medium text-rose-500">首帧+尾帧</span>，AI 将生成两帧之间的平滑过渡动画。
                </>
              )
              : (
                <>
                  当前 HappyHorse 模型仅支持<span className="font-medium text-rose-500">首帧</span>图生视频，不支持尾帧控制。
                  如需首尾帧功能，请切换<span className="font-medium text-rose-500">万相 2.7</span>模型。
                </>
              )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default VideoUploadArea
