'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { RiArrowLeftSLine, RiArrowRightSLine, RiBrainLine, RiChat3Line, RiCloseLine, RiDeleteBinLine, RiGlobalLine, RiImage2Line, RiMagicLine, RiRobot2Line, RiSendPlane2Fill, RiSparkling2Fill, RiStopCircleFill, RiUserSmileLine, RiVideoLine, RiArrowDownSLine } from '@remixicon/react'
import { Markdown } from '@/app/components/base/markdown'
import Button from '@/app/components/base/button'
import { useToastContext } from '@/app/components/base/toast'
import cn from '@/utils/classnames'
import { useChatAssistant } from './use-chat-assistant'
import type { ChatItem, DatasetSelection, FlatModel, HistoryEntry, ModelSelection } from './use-chat-assistant'
import ModelSelector from './model-selector'
import DatasetSelector from './dataset-selector'
import SourcesPanel from './sources-panel'
import { SUGGESTED_QUESTIONS } from './config'
import { VIDEO_MODELS } from '@/service/generate'
import type { VideoModel } from '@/service/generate'
import DocumentUploadButton from './document-upload-button'
import type { DocumentFile } from './document-upload-button'

// ── Inner component ──

const ChatAssistantInner = ({
  supportsFileUpload,
  appReady,
  appError,
  retryInit,
  availableModels,
  selectedModel,
  setSelectedModel,
  selectedDatasets,
  setSelectedDatasets,
  chatList,
  isResponding,
  deepThinking,
  setDeepThinking,
  webSearch,
  setWebSearch,
  visionMode,
  setVisionMode,
  visionModel,
  imageGen,
  setImageGen,
  videoGen,
  setVideoGen,
  videoModel,
  setVideoModel,
  videoTaskStatus,
  sendMessage,
  handleStop,
  handleRestart,
  history,
  historyLoading,
  loadingHistoryId,
  loadConversation,
  deleteHistoryItem,
  refreshHistory,
}: {
  supportsFileUpload: boolean
  appReady: boolean
  appError: string | null
  retryInit: () => void
  availableModels: FlatModel[]
  selectedModel: ModelSelection | null
  setSelectedModel: (sel: ModelSelection | null) => void
  selectedDatasets: DatasetSelection[]
  setSelectedDatasets: (sel: DatasetSelection[]) => void
  chatList: ChatItem[]
  isResponding: boolean
  deepThinking: boolean
  setDeepThinking: (v: boolean) => void
  webSearch: boolean
  setWebSearch: (v: boolean) => void
  visionMode: boolean
  setVisionMode: (v: boolean) => void
  visionModel: { provider: string; model: string; mode: string } | null
  imageGen: boolean
  setImageGen: (v: boolean) => void
  videoGen: boolean
  setVideoGen: (v: boolean) => void
  videoModel: VideoModel
  setVideoModel: (m: VideoModel) => void
  videoTaskStatus: string
  sendMessage: (query: string, files?: any[], documentTexts?: { filename: string; text: string }[]) => Promise<void>
  handleStop: () => void
  handleRestart: () => void
  history: HistoryEntry[]
  historyLoading: boolean
  loadingHistoryId: string | null
  loadConversation: (entry: HistoryEntry) => Promise<void>
  deleteHistoryItem: (id: string) => Promise<void>
  refreshHistory: () => void
}) => {
  const { notify } = useToastContext()
  const [query, setQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Document files (extracted text, managed locally)
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([])

  // Digital human video control — minimum 4s playback
  const digitalHumanRef = useRef<HTMLVideoElement>(null)
  const playStartedAtRef = useRef<number>(0)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = digitalHumanRef.current
    if (!video) return

    if (isResponding) {
      // Clear any pending stop timer
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
      video.currentTime = 0
      video.play().catch(() => { /* ignore autoplay errors */ })
      playStartedAtRef.current = Date.now()
    }
    else {
      // Stop after at least 4 seconds of playback
      const elapsed = Date.now() - playStartedAtRef.current
      const minPlayMs = 4000
      if (playStartedAtRef.current > 0 && elapsed < minPlayMs) {
        stopTimerRef.current = setTimeout(() => {
          video.pause()
          stopTimerRef.current = null
        }, minPlayMs - elapsed)
      }
      else {
        video.pause()
      }
    }
  }, [isResponding])

  const hasMessages = chatList.length > 0
  const currentConversationId = useRef('')

  // 历史翻页
  const HISTORY_PAGE_SIZE = 5
  const [historyPage, setHistoryPage] = useState(0)

  // 数字人拖拽 & 隐藏
  const [isDigitalHumanHidden, setIsDigitalHumanHidden] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCloseButton, setShowCloseButton] = useState(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null)
  const digitalHumanElRef = useRef<HTMLDivElement>(null)
  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE))
  const pagedHistory = history.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE)

  const handleSend = useCallback((text?: string) => {
    const msg = (text || query).trim()
    if (isResponding || !appReady)
      return

    // Check for document files still processing
    if (documentFiles.some(d => d.status === 'extracting' || d.status === 'uploading')) {
      notify({ type: 'warning', message: '文件正在处理中，请稍候' })
      return
    }

    // Collect text from text-based documents
    const docTexts = documentFiles
      .filter(d => d.status === 'done' && d.result && !d.uploadedFileIds?.length)
      .map(d => ({ filename: d.filename, text: d.result!.text }))

    // Collect uploaded file IDs (images + image-based PDF pages)
    const allFiles = documentFiles
      .filter(d => d.status === 'done' && d.uploadedFileIds?.length)
      .flatMap(d => d.uploadedFileIds!.map(id => ({
        type: 'image',
        transfer_method: 'local_file',
        url: '',
        upload_file_id: id,
      })))

    // Require either text, files, or document texts
    if (!msg && !allFiles.length && !docTexts.length) {
      notify({ type: 'info', message: '请输入消息内容' })
      return
    }
    if (!selectedModel && !imageGen && !videoGen) {
      notify({ type: 'warning', message: '请先选择一个模型' })
      return
    }

    const hasAttachments = allFiles.length + docTexts.length > 0
    const finalQuery = msg || (hasAttachments ? '请分析附件中的文件内容' : '')

    sendMessage(finalQuery, allFiles.length ? allFiles : undefined, docTexts.length ? docTexts : undefined)

    // Clear document files after send
    if (documentFiles.length)
      setDocumentFiles([])

    if (!text) {
      setQuery('')
      if (textareaRef.current)
        textareaRef.current.style.height = 'auto'
    }
  }, [query, isResponding, appReady, selectedModel, sendMessage, notify, documentFiles])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposingRef.current)
        return
      e.preventDefault()
      handleSend()
    }
  }

  // 数字人拖拽事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return
      e.preventDefault()
      const dx = e.clientX - dragStartRef.current.mouseX
      const dy = e.clientY - dragStartRef.current.mouseY
      setDragPos({ x: dragStartRef.current.startX + dx, y: dragStartRef.current.startY + dy })
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartRef.current = null
    }
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // 点击外部隐藏关闭按钮
  useEffect(() => {
    if (!showCloseButton) return
    const handleClickOutside = (e: MouseEvent) => {
      const el = digitalHumanElRef.current
      if (el && !el.contains(e.target as Node))
        setShowCloseButton(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCloseButton])

  const handleDigitalHumanMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const el = digitalHumanElRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, startX: dragPos?.x ?? rect.left, startY: dragPos?.y ?? rect.top }
    setIsDragging(true)
  }

  // Auto-scroll
  useEffect(() => {
    if (hasMessages && scrollContainerRef.current)
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
  }, [chatList.length, chatList[chatList.length - 1]?.content, hasMessages])

  return (
    <>
      <div className="relative mx-auto mb-8 w-full max-w-[1200px]">
        <div className="flex h-[520px] gap-5">
          {/* ═══ Left Sidebar — History ═══ */}
          <div className="hidden w-[220px] shrink-0 md:block">
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-components-panel-border bg-components-panel-on-panel-item-bg shadow-sm">
              {/* Sidebar Header */}
              <div className="flex items-center gap-2 border-b border-divider-subtle px-4 py-3">
                <RiChat3Line className="h-4 w-4 text-primary-500" />
                <h3 className="text-[13px] font-semibold text-text-secondary">历史对话</h3>
                {history.length > 0 && (
                  <span className="ml-auto rounded-full bg-util-colors-indigo-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-600">
                    {history.length}
                  </span>
                )}
              </div>

              {/* History List */}
              <div className="no-scrollbar flex-1 overflow-y-auto p-2">
                {historyLoading
                  ? (
                    <div className="flex flex-col items-center px-2 py-8">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
                      </div>
                      <p className="text-xs text-text-quaternary">加载中...</p>
                    </div>
                  )
                  : history.length === 0
                    ? (
                      <div className="flex flex-col items-center px-2 py-8">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-state-base-hover">
                          <RiChat3Line className="h-5 w-5 text-text-quaternary" />
                        </div>
                        <p className="text-xs text-text-quaternary">暂无对话记录</p>
                        <p className="mt-1 text-[11px] text-text-quaternary">开始对话后将自动保存</p>
                      </div>
                    )
                    : (
                      <div className="space-y-0.5">
                        {pagedHistory.map((entry) => {
                          const isActive = currentConversationId.current === entry.conversationId
                          const isLoading = loadingHistoryId === entry.conversationId
                          return (
                            <div
                              key={entry.id}
                              className={cn(
                                'group flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2.5 transition-all duration-150',
                                isActive
                                  ? 'bg-primary-50/80 ring-1 ring-primary-200'
                                  : 'hover:bg-state-base-hover',
                                isLoading && 'opacity-60',
                              )}
                              onClick={() => {
                                if (!isLoading) {
                                  loadConversation(entry)
                                  currentConversationId.current = entry.conversationId
                                }
                              }}
                            >
                              <div className="min-w-0 flex-1">
                                <div className={cn(
                                  'truncate text-[13px] leading-snug',
                                  isActive ? 'font-medium text-primary-700' : 'text-text-secondary',
                                )}
                                >
                                  {entry.title}
                                </div>
                                <div className="mt-1 text-[11px] text-text-quaternary">
                                  {new Date(entry.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="-mr-0.5 mt-0.5 shrink-0 rounded p-1 text-text-quaternary opacity-0 transition-all hover:bg-state-accent-active hover:text-text-destructive group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteHistoryItem(entry.id)
                                }}
                              >
                                <RiDeleteBinLine className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
              </div>

              {/* Pagination */}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-between border-t border-divider-subtle px-3 py-2">
                  <button
                    type="button"
                    disabled={historyPage === 0}
                    className="rounded p-1 text-text-tertiary transition-colors hover:bg-state-base-hover disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                  >
                    <RiArrowLeftSLine className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-text-quaternary">
                    {historyPage + 1} / {totalHistoryPages}
                  </span>
                  <button
                    type="button"
                    disabled={historyPage >= totalHistoryPages - 1}
                    className="rounded p-1 text-text-tertiary transition-colors hover:bg-state-base-hover disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages - 1, p + 1))}
                  >
                    <RiArrowRightSLine className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Right — Chat Card ═══ */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Header */}
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm shadow-primary-500/20">
                  <RiSparkling2Fill className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold leading-tight text-text-secondary">AI 助手</h2>
                  <p className="text-[11px] text-text-quaternary">智能对话 · 随时可用</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {visionMode && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                    <RiImage2Line className="h-3 w-3" />
                    识图模式
                  </span>
                )}
                {imageGen && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-600">
                    <RiMagicLine className="h-3 w-3" />
                    生图模式
                  </span>
                )}
                <ModelSelector
                  models={availableModels}
                  selected={selectedModel}
                  onChange={setSelectedModel}
                />
                {hasMessages && (
                  <button
                    type="button"
                    className="rounded-lg border border-divider-subtle bg-components-panel-on-panel-item-bg px-2.5 py-1.5 text-xs font-medium text-text-tertiary transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
                    onClick={() => {
                      handleRestart()
                      currentConversationId.current = ''
                      setDocumentFiles([])
                      refreshHistory()
                    }}
                  >
                    + 新对话
                  </button>
                )}
              </div>
            </div>

            {/* Main Card */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-components-panel-border bg-components-panel-on-panel-item-bg shadow-sm">

              {/* Error State */}
              {appError && (
                <div className="px-4 py-12">
                  <div className="mx-auto max-w-xs text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                      <span className="text-xl">⚠️</span>
                    </div>
                    <h3 className="mb-1.5 text-base font-semibold text-text-secondary">初始化失败</h3>
                    <p className="mb-5 text-sm leading-relaxed text-text-tertiary">{appError}</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-primary-600/20 transition-all hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/25"
                      onClick={retryInit}
                    >
                      重试
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Area — flex-1 fills remaining space, internal scroll */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                {!appError && !hasMessages
                  ? (
              // Welcome State
                    <div className="px-4 py-10">
                      <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm">
                          <RiSparkling2Fill className="h-7 w-7 text-primary-500" />
                        </div>
                        <h3 className="mb-1.5 text-lg font-semibold text-text-secondary">你好！我是 AI 助手</h3>
                        <p className="text-sm text-text-tertiary">
                          {supportsFileUpload ? '选择模型和知识库，或直接开始对话，支持上传图片或文档分析' : '选择模型和知识库，或直接开始对话，支持上传文档分析'}
                        </p>
                      </div>
                      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2.5">
                        {SUGGESTED_QUESTIONS.map(q => (
                          <button
                            key={q.text}
                            type="button"
                            className="group flex items-center gap-2.5 rounded-xl border border-divider-subtle bg-background-body px-4 py-3 text-left text-sm text-text-tertiary transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 hover:shadow-sm"
                            onClick={() => handleSend(q.text)}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-state-base-hover text-base transition-colors group-hover:bg-primary-100">
                              {q.icon}
                            </span>
                            <span className="leading-snug">{q.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                  : (
              // Conversation
                    <div className="px-4 py-4">
                      {chatList.map((item, index) => {
                        if (item.isAnswer) {
                          const isLast = index === chatList.length - 1
                          return (
                            <div key={item.id} className="mb-4 flex gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-50 to-primary-100">
                                <RiRobot2Line className="h-4 w-4 text-primary-600" />
                              </div>
                              <div className="min-w-0 max-w-[85%]">
                                {item.content
                                  ? (
                                    <div className="rounded-2xl rounded-tl-sm bg-background-body px-4 py-3 shadow-xs">
                                      <Markdown content={item.content} className="!text-sm" />
                                    </div>
                                  )
                                  : (
                                    isLast && isResponding && (
                                      <div className="rounded-2xl rounded-tl-sm bg-background-body px-4 py-3.5 shadow-xs">
                                        {imageGen
                                          ? (
                                            <div className="flex items-center gap-2">
                                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
                                              <span className="text-xs text-violet-500">图片生成中，请稍候...</span>
                                            </div>
                                          )
                                          : videoGen
                                            ? (
                                              <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-500" />
                                                <span className="text-xs text-rose-500">{videoTaskStatus || '视频生成中，请稍候...'}</span>
                                              </div>
                                            )
                                            : (
                                              <div className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '0ms' }} />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '150ms' }} />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '300ms' }} />
                                              </div>
                                            )}
                                      </div>
                                    )
                                  )}
                                {item.sources && item.sources.length > 0 && !(isLast && isResponding) && (
                                  <SourcesPanel sources={item.sources} />
                                )}
                                {item.generatedImages && item.generatedImages.length > 0 && !(isLast && isResponding) && (
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    {item.generatedImages.map((url, i) => (
                                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-lg border border-divider-subtle transition-all hover:shadow-md">
                                        <img src={url} alt={`generated-${i}`} className="h-auto w-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                                          <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-text-secondary opacity-0 shadow-sm transition-all group-hover:opacity-100">
                                            点击查看原图
                                          </span>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {item.generatedVideo && !(isLast && isResponding) && (
                                  <div className="mt-2">
                                    <video
                                      src={item.generatedVideo}
                                      controls
                                      className="w-full max-w-lg rounded-lg border border-divider-subtle"
                                      preload="metadata"
                                    />
                                    {item.videoModel && (
                                      <p className="mt-1 text-xs text-text-tertiary">
                                        🎬 {item.videoModel} 生成
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div key={item.id} className="mb-4 flex justify-end">
                            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary-600 to-primary-600 px-4 py-3 text-sm leading-relaxed text-white shadow-xs">
                              {/* Show attached image files */}
                              {item.files && item.files.length > 0 && (
                                <div className="mb-1.5 flex flex-wrap gap-1">
                                  {item.files.map((f, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[11px]">
                                      🖼️ {f.type === 'image' ? '图片' : '文件'}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {/* Show attached document names */}
                              {item.documentNames && item.documentNames.length > 0 && (
                                <div className="mb-1.5 flex flex-wrap gap-1">
                                  {item.documentNames.map((name, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[11px]">
                                      📄 {name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.content && (
                                <div className="whitespace-pre-wrap break-words">{item.content}</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </div>

              {/* Input Area */}
              <div className="bg-background-default-subtle/30 shrink-0 border-t border-divider-subtle">
                {/* Toggles */}
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                      deepThinking
                        ? 'border-primary-300 bg-primary-50 text-primary-600 shadow-xs shadow-primary-500/10'
                        : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
                      isResponding && 'cursor-not-allowed opacity-50',
                    )}
                    onClick={() => setDeepThinking(!deepThinking)}
                    disabled={isResponding}
                  >
                    <RiBrainLine className="h-3.5 w-3.5" />
                    <span>深度思考</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                      webSearch
                        ? 'border-blue-300 bg-blue-50 text-blue-600 shadow-xs shadow-blue-500/10'
                        : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
                      isResponding && 'cursor-not-allowed opacity-50',
                    )}
                    onClick={() => setWebSearch(!webSearch)}
                    disabled={isResponding}
                  >
                    <RiGlobalLine className="h-3.5 w-3.5" />
                    <span>联网搜索</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                      visionMode
                        ? 'border-amber-300 bg-amber-50 text-amber-600 shadow-xs shadow-amber-500/10'
                        : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
                      isResponding && 'cursor-not-allowed opacity-50',
                    )}
                    onClick={() => {
                      if (!visionModel) {
                        notify({ type: 'warning', message: '未找到识图专用模型 (qwen3.6-plus)，请在模型供应商中配置' })
                        return
                      }
                      setVisionMode(!visionMode)
                      if (!visionMode) { setImageGen(false); setVideoGen(false) }
                    }}
                    disabled={isResponding}
                  >
                    <RiImage2Line className="h-3.5 w-3.5" />
                    <span>识图</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                      imageGen
                        ? 'border-violet-300 bg-violet-50 text-violet-600 shadow-xs shadow-violet-500/10'
                        : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
                      isResponding && 'cursor-not-allowed opacity-50',
                    )}
                    onClick={() => {
                      if (!imageGen) {
                        setVisionMode(false)
                        setVideoGen(false)
                      }
                      setImageGen(!imageGen)
                    }}
                    disabled={isResponding}
                  >
                    <RiMagicLine className="h-3.5 w-3.5" />
                    <span>生图</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                      videoGen
                        ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-xs shadow-rose-500/10'
                        : 'border-divider-regular bg-transparent text-text-tertiary hover:border-components-input-border-hover hover:text-text-secondary',
                      isResponding && 'cursor-not-allowed opacity-50',
                    )}
                    onClick={() => {
                      if (!videoGen) {
                        setVisionMode(false)
                        setImageGen(false)
                      }
                      setVideoGen(!videoGen)
                    }}
                    disabled={isResponding}
                  >
                    <RiVideoLine className="h-3.5 w-3.5" />
                    <span>生视频</span>
                  </button>
                  {videoGen && (
                    <div className="relative">
                      <select
                        value={videoModel.id}
                        onChange={(e) => {
                          const found = VIDEO_MODELS.find(m => m.id === e.target.value)
                          if (found) setVideoModel(found)
                        }}
                        disabled={isResponding}
                        className={cn(
                          'appearance-none rounded-full border border-rose-200 bg-rose-50/50 py-1.5 pl-3 pr-7 text-xs font-medium text-rose-600 transition-all',
                          'focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200',
                          isResponding && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        {VIDEO_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <RiArrowDownSLine className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rose-400" />
                    </div>
                  )}
                  <DatasetSelector
                    selected={selectedDatasets}
                    onChange={setSelectedDatasets}
                    disabled={isResponding}
                  />
                  {/* Unified upload button (images for vision model + documents for any model) */}
                  <DocumentUploadButton
                    documents={documentFiles}
                    onChange={setDocumentFiles}
                    disabled={isResponding}
                    isVisionModel={supportsFileUpload || videoGen}
                  />
                </div>

                {/* Textarea + Send */}
                <div className="flex items-end gap-2.5 px-4 pb-3.5">
                  <Textarea
                    ref={textareaRef}
                    className={cn(
                      'flex-1 resize-none rounded-lg bg-transparent py-2.5 text-sm text-text-primary outline-none',
                      'placeholder:text-text-quaternary',
                    )}
                    placeholder={imageGen ? '描述你想生成的图片内容...' : appReady ? '输入消息，或点击上传按钮添加附件...' : appError ? '初始化失败' : '正在初始化...'}
                    minRows={1}
                    maxRows={6}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => { isComposingRef.current = true }}
                    onCompositionEnd={() => {
                      setTimeout(() => {
                        isComposingRef.current = false
                      }, 50)
                    }}
                    disabled={isResponding || !appReady || !!appError}
                  />
                  {isResponding
                    ? (
                      <Button className="!h-9 !w-9 !shrink-0 !p-0" onClick={handleStop}>
                        <RiStopCircleFill className="h-4 w-4" />
                      </Button>
                    )
                    : (
                      <Button
                        className="!h-9 !w-9 !shrink-0 !p-0"
                        variant="primary"
                        onClick={() => handleSend()}
                        disabled={(!query.trim() && !documentFiles.some(d => d.status === 'done')) || documentFiles.some(d => d.status === 'extracting' || d.status === 'uploading') || !appReady || !!appError}
                      >
                        <RiSendPlane2Fill className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Digital Human — draggable & hideable ═══ */}
        {!isDigitalHumanHidden && (
          <div
            ref={digitalHumanElRef}
            className={cn(
              'fixed z-50 flex select-none flex-col items-center gap-1',
              !isDragging && 'transition-shadow duration-300',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
            style={dragPos ? { left: dragPos.x, top: dragPos.y } : { right: 40, bottom: 100 }}
            onDoubleClick={() => setShowCloseButton(true)}
            onMouseDown={handleDigitalHumanMouseDown}
          >
            {/* 隐藏按钮（双击显示） */}
            {showCloseButton && (
              <button
                type="button"
                className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/80 transition-all hover:bg-black/80 hover:text-white"
                onMouseDown={e => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsDigitalHumanHidden(true)
                  setShowCloseButton(false)
                }}
              >
                <RiCloseLine className="h-3 w-3" />
              </button>
            )}
            <div className={cn(
              'pointer-events-none relative overflow-hidden rounded-2xl shadow-lg transition-all duration-500',
              'w-[120px]',
              isResponding
                ? 'animate-[digital-human-breathe_2.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(139,92,246,0.35),0_0_40px_rgba(139,92,246,0.12)]'
                : 'animate-[digital-human-float_3s_ease-in-out_infinite] shadow-md',
            )} style={{ height: '170px' }}>
              <video
                ref={digitalHumanRef}
                src="/digital-human.mp4"
                muted
                loop
                playsInline
                preload="auto"
                className="absolute left-0 top-[-20px] w-full"
                style={{ height: '213px' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-5">
                <div className="flex items-center gap-1">
                  {isResponding ? (
                    <>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-medium text-white">回答中...</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/60">数字人助手</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 数字人恢复按钮（隐藏时显示） */}
        {isDigitalHumanHidden && (
          <button
            type="button"
            className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-all hover:bg-primary-600 hover:shadow-xl"
            onClick={() => {
              setIsDigitalHumanHidden(false)
              setDragPos(null)
            }}
            title="显示数字人"
          >
            <RiUserSmileLine className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  )
}

// ── Outer component ──

const ChatAssistant = () => {
  const chatProps = useChatAssistant()

  return (
    <ChatAssistantInner
      supportsFileUpload={chatProps.supportsFileUpload}
      appReady={chatProps.appReady}
      appError={chatProps.appError}
      retryInit={chatProps.retryInit}
      availableModels={chatProps.availableModels}
      selectedModel={chatProps.selectedModel}
      setSelectedModel={chatProps.setSelectedModel}
      selectedDatasets={chatProps.selectedDatasets}
      setSelectedDatasets={chatProps.setSelectedDatasets}
      chatList={chatProps.chatList}
      isResponding={chatProps.isResponding}
      deepThinking={chatProps.deepThinking}
      setDeepThinking={chatProps.setDeepThinking}
      webSearch={chatProps.webSearch}
      setWebSearch={chatProps.setWebSearch}
      visionMode={chatProps.visionMode}
      setVisionMode={chatProps.setVisionMode}
      visionModel={chatProps.visionModel}
      imageGen={chatProps.imageGen}
      setImageGen={chatProps.setImageGen}
      videoGen={chatProps.videoGen}
      setVideoGen={chatProps.setVideoGen}
      videoModel={chatProps.videoModel}
      setVideoModel={chatProps.setVideoModel}
      videoTaskStatus={chatProps.videoTaskStatus}
      sendMessage={chatProps.sendMessage}
      handleStop={chatProps.handleStop}
      handleRestart={chatProps.handleRestart}
      history={chatProps.history}
      historyLoading={chatProps.historyLoading}
      loadingHistoryId={chatProps.loadingHistoryId}
      loadConversation={chatProps.loadConversation}
      deleteHistoryItem={chatProps.deleteHistoryItem}
      refreshHistory={chatProps.refreshHistory}
    />
  )
}

export default ChatAssistant
