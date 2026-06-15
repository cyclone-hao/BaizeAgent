'use client'

import { useRef, useState } from 'react'
import { RiAttachmentLine, RiCloseLine, RiFileTextLine, RiImageLine, RiLoader4Line } from '@remixicon/react'
import cn from '@/utils/classnames'
import Tooltip from '@/app/components/base/tooltip'
import { fileUpload } from '@/app/components/base/file-uploader/utils'
import { extractDocumentText, getAcceptString, isSupportedDocument } from './document-extractor'
import type { ExtractionResult } from './document-extractor'

// ── Types ──────────────────────────────────────────

export type DocumentFile = {
  id: string
  filename: string
  status: 'extracting' | 'uploading' | 'done' | 'error'
  result?: ExtractionResult
  /** 图片型 PDF 上传到服务器后的 file_id 列表 */
  uploadedFileIds?: string[]
  error?: string
}

type DocumentUploadButtonProps = {
  documents: DocumentFile[]
  onChange: (docs: DocumentFile[]) => void
  disabled?: boolean
  /** 当前是否为视觉模型（图片型 PDF 需要视觉模型） */
  isVisionModel?: boolean
}

// ── Component ──────────────────────────────────────

let docIdCounter = 0

const DocumentUploadButton = ({
  documents,
  onChange,
  disabled,
  isVisionModel = false,
}: DocumentUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length)
      return

    // Reset input so the same file can be selected again
    e.target.value = ''

    setExtracting(true)

    const newDocs: DocumentFile[] = selectedFiles.map(f => ({
      id: `doc_${Date.now()}_${++docIdCounter}`,
      filename: f.name,
      status: 'extracting' as const,
    }))

    // Add new docs to the list
    const allDocs = [...documents, ...newDocs]
    onChange(allDocs)

    // Extract text from each file
    for (let idx = 0; idx < selectedFiles.length; idx++) {
      const file = selectedFiles[idx]
      const docId = newDocs[idx].id

      try {
        if (!isSupportedDocument(file.name))
          throw new Error(`不支持的文件类型: ${file.name}`)

        const result = await extractDocumentText(file)

        // 图片型 PDF 处理
        if (result.isImageBased && result.pageImages?.length) {
          if (!isVisionModel) {
            // 非视觉模型：提示用户切换
            onChange(prev => prev.map(d =>
              d.id === docId
                ? { ...d, status: 'error' as const, result, error: `该 PDF 为图片型（共 ${result.pageCount} 页），需要视觉模型分析，请切换模型后重试` }
                : d,
            ))
            continue
          }

          // 视觉模型：上传页面图片到服务器
          onChange(prev => prev.map(d =>
            d.id === docId ? { ...d, status: 'uploading' as const, result } : d,
          ))

          const uploadedIds: string[] = []
          for (const pageImage of result.pageImages) {
            try {
              const uploadResult = await new Promise<{ id: string }>((resolve, reject) => {
                fileUpload({
                  file: pageImage,

                  onProgressCallback: () => { /* noop */ },
                  onSuccessCallback: (res: { id: string }) => resolve(res),
                  onErrorCallback: () => reject(new Error('图片上传失败')),
                })
              })
              uploadedIds.push(uploadResult.id)
            }
            catch {
              // 单页上传失败，继续其他页
              console.warn(`Failed to upload page image: ${pageImage.name}`)
            }
          }

          if (uploadedIds.length === 0) {
            onChange(prev => prev.map(d =>
              d.id === docId
                ? { ...d, status: 'error' as const, error: 'PDF 页面图片上传失败，请重试' }
                : d,
            ))
          }
          else {
            const truncatedMsg = result.pageCount > result.pageImages.length
              ? `（已上传前 ${result.pageImages.length} 页，共 ${result.pageCount} 页）`
              : `（${uploadedIds.length} 页图片）`
            onChange(prev => prev.map(d =>
              d.id === docId
                ? { ...d, status: 'done' as const, uploadedFileIds: uploadedIds, error: undefined }
                : d,
            ))
            // Store the truncated message in result for display
            const doc = documents.find(d => d.id === docId) || newDocs[idx]
            if (doc) {
              const updatedResult = { ...result, text: `图片型 PDF ${truncatedMsg}，请通过图片分析文档内容` }
              onChange(prev => prev.map(d =>
                d.id === docId ? { ...d, result: updatedResult, uploadedFileIds: uploadedIds } : d,
              ))
            }
          }
        }
        else {
          // 文本型文档：正常完成
          onChange(prev => prev.map(d =>
            d.id === docId ? { ...d, status: 'done' as const, result } : d,
          ))
        }
      }
      catch (err: any) {
        onChange(prev => prev.map(d =>
          d.id === docId
            ? { ...d, status: 'error' as const, error: err?.message || '提取失败' }
            : d,
        ))
      }
    }

    setExtracting(false)
  }

  const removeDocument = (id: string) => {
    onChange(documents.filter(d => d.id !== id))
  }

  const hasSuccessful = documents.some(d => d.status === 'done')

  return (
    <div className="flex items-center gap-1.5">
      {/* Upload Button */}
      <Tooltip
        popupContent={
          <span>
            上传文档（PDF、Word、TXT 等）
            <br />
            <span className="text-text-quaternary">自动提取文本或图片供 AI 分析</span>
          </span>
        }
      >
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
            hasSuccessful
              ? 'border-emerald-300 bg-emerald-50 text-emerald-600 shadow-xs shadow-emerald-500/10'
              : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
            (disabled || extracting) && 'cursor-not-allowed opacity-50',
          )}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || extracting}
        >
          {extracting
            ? <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
            : <RiAttachmentLine className="h-3.5 w-3.5" />}
          <span>文档</span>
        </button>
      </Tooltip>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={getAcceptString()}
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Document chips */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {documents.map(doc => (
            <div
              key={doc.id}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-colors',
                doc.status === 'done' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                (doc.status === 'extracting' || doc.status === 'uploading') && 'border-divider-regular bg-state-base-hover text-text-quaternary',
                doc.status === 'error' && 'border-red-200 bg-red-50 text-red-600',
              )}
            >
              {(doc.status === 'extracting' || doc.status === 'uploading') && <RiLoader4Line className="h-3 w-3 animate-spin" />}
              {doc.status === 'error' && <span className="text-[10px]">⚠️</span>}
              {doc.status === 'done' && (doc.uploadedFileIds?.length ? <RiImageLine className="h-3 w-3" /> : <RiFileTextLine className="h-3 w-3" />)}
              <span className="max-w-[80px] truncate">{doc.filename}</span>
              {doc.status === 'done' && doc.uploadedFileIds && (
                <span className="text-emerald-500">{doc.uploadedFileIds.length} 页图片</span>
              )}
              {doc.status === 'done' && !doc.uploadedFileIds && doc.result && (
                <span className="text-emerald-500">
                  {doc.result.charCount > 1000
                    ? `${Math.round(doc.result.charCount / 1000)}k字`
                    : `${doc.result.charCount}字`}
                  {doc.result.truncated && ' (截断)'}
                </span>
              )}
              {doc.status === 'uploading' && <span>上传中...</span>}
              {doc.status === 'extracting' && <span>解析中...</span>}
              {doc.status === 'error' && (
                <span className="max-w-[150px] truncate text-[10px] text-red-400">{doc.error}</span>
              )}
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/5"
                onClick={() => removeDocument(doc.id)}
              >
                <RiCloseLine className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentUploadButton
