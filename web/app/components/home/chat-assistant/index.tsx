'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { RiArrowLeftSLine, RiArrowRightSLine, RiBrainLine, RiChat3Line, RiDeleteBinLine, RiGlobalLine, RiRobot2Line, RiSendPlane2Fill, RiSparkling2Fill, RiStopCircleFill } from '@remixicon/react'
import { Markdown } from '@/app/components/base/markdown'
import Button from '@/app/components/base/button'
import { useToastContext } from '@/app/components/base/toast'
import { FileContextProvider, useFileStore } from '@/app/components/base/file-uploader/store'
import { useFile } from '@/app/components/base/file-uploader/hooks'
import { getProcessedFiles } from '@/app/components/base/file-uploader/utils'
import FileUploaderInChatInput from '@/app/components/base/file-uploader/file-uploader-in-chat-input'
import { FileListInChatInput } from '@/app/components/base/file-uploader/file-uploader-in-chat-input/file-list'
import cn from '@/utils/classnames'
import { useChatAssistant } from './use-chat-assistant'
import type { ChatItem, DatasetSelection, FlatModel, HistoryEntry, ModelSelection } from './use-chat-assistant'
import ModelSelector from './model-selector'
import DatasetSelector from './dataset-selector'
import SourcesPanel from './sources-panel'
import { SUGGESTED_QUESTIONS } from './config'
import type { FileUpload } from '@/app/components/base/features/types'
import DocumentUploadButton from './document-upload-button'
import type { DocumentFile } from './document-upload-button'

// ── Inner component (inside FileContextProvider) ──

const ChatAssistantInner = ({
  fileUploadConfig,
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
  fileUploadConfig: FileUpload
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

  // File upload hooks (only active when supportsFileUpload)
  const {
    handleClipboardPasteFile,
    handleDragFileEnter,
    handleDragFileOver,
    handleDragFileLeave,
    handleDropFile,
    isDragActive,
  } = useFile(fileUploadConfig)

  const fileStore = useFileStore()

  // Clear files when switching to non-vision model
  useEffect(() => {
    if (!supportsFileUpload)
      fileStore.getState().setFiles([])
  }, [supportsFileUpload, fileStore])

  const hasMessages = chatList.length > 0
  const currentConversationId = useRef('')

  // 历史翻页
  const HISTORY_PAGE_SIZE = 5
  const [historyPage, setHistoryPage] = useState(0)
  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE))
  const pagedHistory = history.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE)

  const handleSend = useCallback((text?: string) => {
    const msg = (text || query).trim()
    if (isResponding || !appReady)
      return

    // Check for attached image files (vision model)
    let processedFiles: any[] | undefined
    if (supportsFileUpload) {
      const storeFiles = fileStore.getState().files
      // Check for files still uploading
      if (storeFiles.some(f => f.progress > 0 && f.progress < 100)) {
        notify({ type: 'warning', message: '文件正在上传中，请稍候' })
        return
      }
      processedFiles = getProcessedFiles(storeFiles)
      if (processedFiles.length === 0)
        processedFiles = undefined
    }

    // Check for document files with extracted text (any model)
    if (documentFiles.some(d => d.status === 'extracting' || d.status === 'uploading')) {
      notify({ type: 'warning', message: '文档正在处理中，请稍候' })
      return
    }
    const docTexts = documentFiles
      .filter(d => d.status === 'done' && d.result && !d.uploadedFileIds?.length)
      .map(d => ({ filename: d.filename, text: d.result!.text }))

    // Collect image-based PDF page images (already uploaded to server)
    const pdfImageFiles = documentFiles
      .filter(d => d.status === 'done' && d.uploadedFileIds?.length)
      .flatMap(d => d.uploadedFileIds!.map(id => ({
        type: 'image',
        transfer_method: 'local_file',
        url: '',
        upload_file_id: id,
      })))

    // Merge manually uploaded images + PDF page images
    const allFiles = [...(processedFiles || []), ...pdfImageFiles]

    // Require either text, image files, or document files
    if (!msg && !allFiles.length && !docTexts.length) {
      notify({ type: 'info', message: '请输入消息内容' })
      return
    }
    if (!selectedModel) {
      notify({ type: 'warning', message: '请先选择一个模型' })
      return
    }

    // When files are attached but no text, use a default prompt
    const hasAttachments = allFiles.length + docTexts.length > 0
    const finalQuery = msg || (hasAttachments ? '请分析附件中的文件内容' : '')

    sendMessage(finalQuery, allFiles.length ? allFiles : undefined, docTexts.length ? docTexts : undefined)

    // Clear image files after send
    if (supportsFileUpload)
      fileStore.getState().setFiles([])

    // Clear document files after send
    if (documentFiles.length)
      setDocumentFiles([])

    if (!text) {
      setQuery('')
      if (textareaRef.current)
        textareaRef.current.style.height = 'auto'
    }
  }, [query, isResponding, appReady, selectedModel, sendMessage, notify, supportsFileUpload, fileStore, documentFiles])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposingRef.current)
        return
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-scroll
  useEffect(() => {
    if (hasMessages && scrollContainerRef.current)
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
  }, [chatList.length, chatList[chatList.length - 1]?.content, hasMessages])

  return (
    <div className="mb-8 flex items-stretch gap-5">
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
                              <span className="mx-1">·</span>
                              {entry.messageCount} 轮
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
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
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
        <div className="relative overflow-hidden rounded-xl border border-components-panel-border bg-components-panel-on-panel-item-bg shadow-sm">

          {/* Drag overlay */}
          {supportsFileUpload && isDragActive && (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-primary-400 bg-primary-50/80">
              <div className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-primary-600 shadow-md">
                📎 松开以上传文件
              </div>
            </div>
          )}

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

          {/* Chat Area */}
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
                    {supportsFileUpload ? '选择模型和知识库，或直接开始对话，支持上传图片和文档分析' : '选择模型和知识库，或直接开始对话，支持上传文档分析'}
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
              <div ref={scrollContainerRef} className="max-h-[650px] overflow-y-auto px-4 py-4">
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
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '0ms' }} />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '150ms' }} />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '300ms' }} />
                                  </div>
                                </div>
                              )
                            )}
                          {item.sources && item.sources.length > 0 && !(isLast && isResponding) && (
                            <SourcesPanel sources={item.sources} />
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

          {/* Input Area */}
          <div className="bg-background-default-subtle/30 border-t border-divider-subtle">
            {/* File preview list (vision model only) */}
            {supportsFileUpload && (
              <div className="px-4 pt-2.5">
                <FileListInChatInput fileConfig={fileUploadConfig} />
              </div>
            )}

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
              <DatasetSelector
                selected={selectedDatasets}
                onChange={setSelectedDatasets}
                disabled={isResponding}
              />
              {/* File upload button (vision model only — images) */}
              {supportsFileUpload && (
                <FileUploaderInChatInput fileConfig={fileUploadConfig} />
              )}
              {/* Document upload button (any model — text extraction) */}
              <DocumentUploadButton
                documents={documentFiles}
                onChange={setDocumentFiles}
                disabled={isResponding}
                isVisionModel={supportsFileUpload}
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
                placeholder={appReady ? (supportsFileUpload ? '输入消息，或拖拽图片/点击文档按钮...' : '输入消息，或点击文档按钮上传文件...') : appError ? '初始化失败' : '正在初始化...'}
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
                {...(supportsFileUpload ? {
                  onPaste: handleClipboardPasteFile as any,
                  onDragEnter: handleDragFileEnter as any,
                  onDragOver: handleDragFileOver as any,
                  onDragLeave: handleDragFileLeave as any,
                  onDrop: handleDropFile as any,
                } : {})}
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
                    disabled={(!query.trim() && !(supportsFileUpload && fileStore.getState().files.length > 0) && !documentFiles.some(d => d.status === 'done')) || documentFiles.some(d => d.status === 'extracting' || d.status === 'uploading') || !appReady || !!appError}
                  >
                    <RiSendPlane2Fill className="h-4 w-4" />
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Outer component (wraps in FileContextProvider) ──

const ChatAssistant = () => {
  const chatProps = useChatAssistant()

  return (
    <FileContextProvider>
      <ChatAssistantInner
        fileUploadConfig={chatProps.fileUploadConfig as FileUpload}
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
    </FileContextProvider>
  )
}

export default ChatAssistant
