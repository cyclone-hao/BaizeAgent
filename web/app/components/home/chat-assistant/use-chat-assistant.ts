'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProviderContext } from '@/context/provider-context'
import {
  ModelStatusEnum,
} from '@/app/components/header/account-setting/model-provider-page/declarations'
import type { Model as ModelGroup } from '@/app/components/header/account-setting/model-provider-page/declarations'
import { TransferMethod } from '@/types/app'
import { useToastContext } from '@/app/components/base/toast'
import { createApp } from '@/service/apps'
import {
  deleteChatConversation,
  fetchChatConversations,
  fetchConversationMessages,
  saveImageMessage,
  saveVideoMessage,
  sendChatMessage,
  stopChatMessageResponding,
} from '@/service/debug'
import { get } from '@/service/base'
import { fetchWebSearch } from '@/service/web-search'
import type { WebSearchResult } from '@/service/web-search'
import { generateImage, generateVideo, pollVideoTask, VIDEO_MODELS } from '@/service/generate'
import type { ImageGenerateResponse, VideoModel } from '@/service/generate'
import type { AppDetailResponse } from '@/models/app'
import {
  BASE_APP_STORAGE_KEY,
  DATASET_STORAGE_KEY,
  DEFAULT_COMPLETION_PARAMS,
  DEFAULT_SYSTEM_PROMPT,
  ENV_HOME_CHAT_APP_ID,
  MODEL_STORAGE_KEY,
  VIDEO_MODEL_STORAGE_KEY,
  VIDEO_POLL_INTERVAL,
  VIDEO_POLL_TIMEOUT,
  VIDEO_STATUS_LABELS,
  VISION_SYSTEM_PROMPT,
  findVisionModel,
  getReasoningParams,
  isReasoningModel,
} from './config'
import { buildDocumentContext } from './document-extractor'

// ── Types ──────────────────────────────────────────

export type FlatModel = {
  provider: string
  providerLabel: string
  model: string
  modelLabel: string
  mode: string
  features: string[]
}

export type ChatItem = {
  id: string
  content: string
  isAnswer: boolean
  sources?: WebSearchResult[]
  files?: { type: string; transfer_method: string; url: string; upload_file_id: string }[]
  documentNames?: string[]
  generatedImages?: string[]
  generatedVideo?: string
  videoModel?: string
}

export type ModelSelection = {
  provider: string
  model: string
  mode: string
}

export type DatasetSelection = {
  id: string
  name: string
}

/** 历史对话条目 — 来自数据库 API */
export type HistoryEntry = {
  id: string
  conversationId: string
  title: string
  messageCount: number
  createdAt: number
  updatedAt: number
}

// ── Helpers ────────────────────────────────────────

let idCounter = 0
const genId = () => `msg_${Date.now()}_${++idCounter}`

function flattenModels(groups: ModelGroup[]): FlatModel[] {
  const result: FlatModel[] = []
  for (const group of groups) {
    for (const m of group.models) {
      if (m.status !== ModelStatusEnum.active)
        continue
      result.push({
        provider: group.provider,
        providerLabel: group.label.zh_Hans || group.label.en_US,
        model: m.model,
        modelLabel: m.label.zh_Hans || m.label.en_US,
        mode: (m.model_properties.mode as string) || 'chat',
        features: (m.features || []) as string[],
      })
    }
  }
  return result
}

function loadModelSelection(): ModelSelection | null {
  if (typeof window === 'undefined')
    return null
  try {
    const raw = localStorage.getItem(MODEL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  }
  catch { return null }
}

function saveModelSelection(sel: ModelSelection | null) {
  if (sel)
    localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(sel))
  else
    localStorage.removeItem(MODEL_STORAGE_KEY)
}

function loadDatasetSelection(): DatasetSelection[] {
  if (typeof window === 'undefined')
    return []
  try {
    const raw = localStorage.getItem(DATASET_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  }
  catch { return [] }
}

function saveDatasetSelection(sel: DatasetSelection[]) {
  if (sel.length)
    localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(sel))
  else
    localStorage.removeItem(DATASET_STORAGE_KEY)
}

// ── Hook ───────────────────────────────────────────

export function useChatAssistant() {
  const { textGenerationModelList } = useProviderContext()
  const { notify } = useToastContext()

  // ── Base App (auto-create with validation) ──
  const [baseAppId, setBaseAppId] = useState<string | null>(null)
  const [appReady, setAppReady] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)
  const creatingRef = useRef(false)

  const initApp = useCallback(async () => {
    if (creatingRef.current)
      return
    creatingRef.current = true
    setAppError(null)

    try {
      // 优先使用环境变量配置的全局共享应用
      if (ENV_HOME_CHAT_APP_ID) {
        try {
          await get<AppDetailResponse>(`apps/${ENV_HOME_CHAT_APP_ID}`)
          setBaseAppId(ENV_HOME_CHAT_APP_ID)
          setAppReady(true)
          return
        }
        catch {
          console.warn(`环境变量 NEXT_PUBLIC_HOME_CHAT_APP_ID 配置的应用 ${ENV_HOME_CHAT_APP_ID} 不存在或无法访问`)
        }
      }

      // 回退：使用 localStorage 缓存的每用户独立应用
      const cached = localStorage.getItem(BASE_APP_STORAGE_KEY)
      if (cached) {
        try {
          await get<AppDetailResponse>(`apps/${cached}`)
          setBaseAppId(cached)
          setAppReady(true)
          return
        }
        catch {
          localStorage.removeItem(BASE_APP_STORAGE_KEY)
        }
      }

      const app = await Promise.resolve(createApp({
        name: '首页对话助手',
        mode: 'chat',
        icon_type: 'emoji',
        icon: '🤖',
        icon_background: '#E0E7FF',
        description: '首页 AI 对话助手基础应用（请勿删除）',
      }))
      localStorage.setItem(BASE_APP_STORAGE_KEY, app.id)
      setBaseAppId(app.id)
      setAppReady(true)
    }
    catch (err: any) {
      const msg = err?.message || '应用初始化失败，请刷新页面重试'
      setAppError(msg)
      console.error('Failed to initialize base app:', err)
    }
    finally {
      creatingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (appReady || appError)
      return
    initApp()
  }, [appReady, appError, initApp])

  // ── Available Models ──
  const availableModels = useMemo(
    () => flattenModels(textGenerationModelList || []),
    [textGenerationModelList],
  )

  // ── Selected Model ──
  const [selectedModel, setSelectedModelRaw] = useState<ModelSelection | null>(
    () => loadModelSelection(),
  )

  const setSelectedModel = useCallback((sel: ModelSelection | null) => {
    setSelectedModelRaw(sel)
    saveModelSelection(sel)
  }, [])

  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      const first = availableModels[0]
      setSelectedModel({ provider: first.provider, model: first.model, mode: first.mode })
    }
  }, [availableModels, selectedModel, setSelectedModel])

  // ── Selected Datasets ──
  const [selectedDatasets, setSelectedDatasetsRaw] = useState<DatasetSelection[]>(
    () => loadDatasetSelection(),
  )

  const setSelectedDatasets = useCallback((sel: DatasetSelection[]) => {
    setSelectedDatasetsRaw(sel)
    saveDatasetSelection(sel)
  }, [])

  // ── Chat State ──
  const [chatList, setChatList] = useState<ChatItem[]>([])
  const chatListRef = useRef<ChatItem[]>([])
  useEffect(() => {
    chatListRef.current = chatList
  }, [chatList])
  const [isResponding, setIsResponding] = useState(false)
  const [deepThinking, setDeepThinking] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const [visionMode, setVisionMode] = useState(false)
  const [imageGen, setImageGen] = useState(false)
  const [videoGen, setVideoGen] = useState(false)
  const [videoTaskStatus, setVideoTaskStatus] = useState('')

  // ── Video Model Selection ──
  const loadVideoModel = useCallback((): VideoModel => {
    if (typeof window === 'undefined') return VIDEO_MODELS[0]
    try {
      const raw = localStorage.getItem(VIDEO_MODEL_STORAGE_KEY)
      if (raw) {
        const found = VIDEO_MODELS.find(m => m.id === raw)
        if (found) return found
      }
    } catch { /* ignore */ }
    return VIDEO_MODELS[0]
  }, [])

  const [videoModel, setVideoModelRaw] = useState<VideoModel>(() => loadVideoModel())

  const setVideoModel = useCallback((m: VideoModel) => {
    setVideoModelRaw(m)
    localStorage.setItem(VIDEO_MODEL_STORAGE_KEY, m.id)
  }, [])
  const conversationIdRef = useRef('')
  const taskIdRef = useRef('')
  const lastMessageIdRef = useRef('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // ── History (from database) ──
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null)

  /** 从数据库加载会话列表 */
  const fetchHistory = useCallback(async () => {
    if (!baseAppId)
      return
    setHistoryLoading(true)
    try {
      const res = await fetchChatConversations(baseAppId, {
        page: 1,
        limit: 50,
        sort_by: '-updated_at',
      }) as any
      const items = (res?.data || []).map((c: any) => ({
        id: c.id,
        conversationId: c.id,
        title: c.name || '对话',
        messageCount: c.dialogue_count || 0,
        // API 返回的时间戳可能是秒级或 ISO 字符串
        createdAt: (typeof c.created_at === 'number' ? c.created_at : new Date(c.created_at).getTime()) * (typeof c.created_at === 'number' ? 1000 : 1),
        updatedAt: (typeof c.updated_at === 'number' ? c.updated_at : new Date(c.updated_at).getTime()) * (typeof c.updated_at === 'number' ? 1000 : 1),
      }))
      setHistory(items)
    }
    catch (err) {
      console.error('Failed to fetch conversation history:', err)
    }
    finally {
      setHistoryLoading(false)
    }
  }, [baseAppId])

  // 应用就绪后自动加载历史
  useEffect(() => {
    if (appReady && baseAppId)
      fetchHistory()
  }, [appReady, baseAppId, fetchHistory])

  /** 点击历史条目，从数据库加载该会话的消息 */
  const loadConversation = useCallback(async (entry: HistoryEntry) => {
    if (!baseAppId)
      return
    setLoadingHistoryId(entry.conversationId)
    try {
      const res = await fetchConversationMessages(baseAppId, entry.conversationId) as any
      const messages = res?.data || []
      const items: ChatItem[] = []
      for (const msg of messages) {
        items.push({
          id: `question-${msg.id}`,
          content: msg.query || '',
          isAnswer: false,
        })

        // 检测生图记录：answer 字段包含 JSON { type: "image_generation", image_urls: [...] }
        // 检测视频生成记录：answer 字段包含 JSON { type: "video_generation", video_url: "..." }
        let answerContent = msg.answer || ''
        let generatedImages: string[] | undefined
        let generatedVideo: string | undefined
        let videoModelName: string | undefined
        try {
          const parsed = JSON.parse(answerContent)
          if (parsed?.type === 'image_generation' && Array.isArray(parsed.image_urls)) {
            generatedImages = parsed.image_urls
            answerContent = '🎨 已为你生成图片：'
          }
          else if (parsed?.type === 'video_generation' && parsed.video_url) {
            generatedVideo = parsed.video_url
            const modelId = parsed.model || ''
            videoModelName = modelId.includes('happyhorse') ? 'HappyHorse' : modelId.includes('wan') ? '万相' : modelId
            answerContent = '🎬 已为你生成视频'
          }
        }
        catch {
          // Not JSON, use as-is
        }

        items.push({
          id: msg.id,
          content: answerContent,
          isAnswer: true,
          generatedImages,
          generatedVideo,
          videoModel: videoModelName,
        })
      }
      setChatList(items)
      conversationIdRef.current = entry.conversationId
      lastMessageIdRef.current = messages.length > 0 ? messages[messages.length - 1].id : ''
      taskIdRef.current = ''
      abortControllerRef.current = null
      setIsResponding(false)
    }
    catch (err) {
      console.error('Failed to load conversation messages:', err)
    }
    finally {
      setLoadingHistoryId(null)
    }
  }, [baseAppId])

  /** 删除会话（调用数据库 API） */
  const deleteHistoryItem = useCallback(async (id: string) => {
    if (!baseAppId)
      return
    try {
      await deleteChatConversation(baseAppId, id)
      setHistory(prev => prev.filter(e => e.id !== id))
    }
    catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }, [baseAppId])

  // ── Build search context for prompt injection ──
  const buildSearchContext = useCallback((results: WebSearchResult[]) => {
    if (!results.length)
      return ''

    const items = results.map((r, i) =>
      `[${i + 1}] ${r.title}\n    摘要: ${r.content.slice(0, 500)}\n    来源: ${r.url}`,
    ).join('\n\n')

    return `\n\n以下是网络搜索结果，请参考回答用户的问题：\n${items}\n\n`
      + '回答要求：\n'
      + '- 使用 [1]、[2] 等编号标注引用来源\n'
      + '- 如果搜索结果与问题无关，请基于自身知识回答\n'
      + '- 回答要准确，不要编造搜索结果中没有的信息'
  }, [])

  // ── Model capability detection ──
  const currentModelFeatures = useMemo(() => {
    if (!selectedModel)
      return [] as string[]
    const m = availableModels.find(
      am => am.provider === selectedModel.provider && am.model === selectedModel.model,
    )
    return m?.features ?? ([] as string[])
  }, [selectedModel, availableModels])

  const isVisionModel = useMemo(() => currentModelFeatures.includes('vision'), [currentModelFeatures])
  // NOTE: document-capable models (e.g. qwen-long) have plugin compatibility issues
  // with the Tongyi provider — fileid:// format causes 400 errors.
  // Only enable file upload for vision models (image analysis works reliably).

  // 识图模式：查找 qwen3.6-plus 视觉模型，开启时强制使用并启用图片上传
  const visionModel = useMemo(() => findVisionModel(availableModels), [availableModels])
  const supportsFileUpload = isVisionModel || visionMode

  // ── File upload config (images only — document support pending plugin fix) ──
  const fileUploadConfig = useMemo(() => {
    if (!supportsFileUpload) {
      return {
        enabled: false,
        image: { enabled: false },
        allowed_file_types: [] as string[],
        allowed_file_upload_methods: [] as TransferMethod[],
        number_limits: 0,
      }
    }

    return {
      enabled: true,
      image: { enabled: true, detail: 'high' as const, number_limits: 3, transfer_methods: [TransferMethod.local_file] },
      document: { enabled: false, number_limits: 0, transfer_methods: [TransferMethod.local_file] },
      allowed_file_types: ['image'] as string[],
      allowed_file_extensions: [] as string[],
      allowed_file_upload_methods: [TransferMethod.local_file],
      number_limits: 3,
    }
  }, [supportsFileUpload])

  // ── Build model_config ──
  const buildModelConfig = useCallback((
    model: ModelSelection,
    datasets: DatasetSelection[],
    useDeepThinking: boolean,
    searchResults: WebSearchResult[] = [],
    documentContext: string = '',
    isVisionModeFlag: boolean = false,
  ) => {
    const completionParams: Record<string, unknown> = { ...DEFAULT_COMPLETION_PARAMS }
    if (useDeepThinking && isReasoningModel(model.model)) {
      const reasoningParams = getReasoningParams(model.model)
      if (reasoningParams)
        Object.assign(completionParams, reasoningParams)
    }

    const basePrompt = isVisionModeFlag ? VISION_SYSTEM_PROMPT : DEFAULT_SYSTEM_PROMPT
    const prePrompt = basePrompt + buildSearchContext(searchResults) + documentContext

    const config: Record<string, any> = {
      model: {
        provider: model.provider,
        name: model.model,
        mode: model.mode || 'chat',
        completion_params: completionParams,
      },
      pre_prompt: prePrompt,
      prompt_type: 'simple',
      chat_prompt_config: {},
      completion_prompt_config: {},
      user_input_form: [],
      dataset_query_variable: '',
      opening_statement: '',
      more_like_this: { enabled: false },
      suggested_questions_after_answer: { enabled: false },
      speech_to_text: { enabled: false },
      text_to_speech: { enabled: false },
      retriever_resource: { enabled: datasets.length > 0 },
      sensitive_word_avoidance: { enabled: false },
      agent_mode: { enabled: false, tools: [] },
      file_upload: supportsFileUpload
        ? {
          enabled: true,
          image: { enabled: true, number_limits: 3, detail: 'high', transfer_methods: ['local_file'] },
          document: { enabled: false },
          allowed_file_types: ['image'],
          allowed_file_upload_methods: ['local_file'],
          number_limits: 3,
        }
        : { image: { enabled: false } },
      dataset_configs: {
        retrieval_model: 'multiple',
        datasets: {
          datasets: datasets.map(d => ({ dataset: { enabled: true, id: d.id } })),
        },
        top_k: 4,
        score_threshold_enabled: false,
        score_threshold: 0.8,
        reranking_enable: false,
        metadata_filtering_mode: 'disabled',
      },
    }
    return config
  }, [buildSearchContext, supportsFileUpload])

  // ── Strip think tags ──
  const stripThinkTags = useCallback((content: string) => {
    return content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<think>[\s\S]*$/, '')
      .trim()
  }, [])

  // ── Send Message ──
  const sendMessage = useCallback(async (
    query: string,
    files?: { type: string; transfer_method: string; url: string; upload_file_id: string }[],
    documentTexts?: { filename: string; text: string }[],
  ) => {
    if (isResponding)
      return

    // ── Image Generation Mode ──
    if (imageGen) {
      if (!query.trim()) {
        notify({ type: 'info', message: '请输入图片描述' })
        return
      }

      const userMsg: ChatItem = { id: genId(), content: query, isAnswer: false }
      const aiMsgId = genId()
      const aiMsg: ChatItem = { id: aiMsgId, content: '', isAnswer: true }
      setChatList(prev => [...prev, userMsg, aiMsg])
      setIsResponding(true)

      try {
        const result: ImageGenerateResponse = await generateImage(query)
        const images = result.images || []
        if (images.length > 0) {
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: `🎨 已为你生成图片：`, generatedImages: images }
              : item,
          ))
        }
        else {
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: '⚠️ 图片生成未返回结果，请重试' }
              : item,
          ))
        }

        // 持久化对话：使用 saveImageMessage 直接保存生图记录，不触发 LLM
        if (baseAppId && images.length > 0) {
          saveImageMessage(baseAppId, {
            query: query,
            image_urls: images,
            conversation_id: conversationIdRef.current || undefined,
          }).then((res: any) => {
            if (res?.conversation_id)
              conversationIdRef.current = res.conversation_id
            if (res?.message_id)
              lastMessageIdRef.current = res.message_id
            setTimeout(() => fetchHistory(), 300)
          }).catch((err) => {
            console.error('Failed to save image message:', err)
          })
        }
      }
      catch (err: any) {
        const msg = err?.message || '图片生成失败'
        setChatList(prev => prev.map((item, idx) =>
          idx === prev.length - 1 && item.isAnswer
            ? { ...item, content: `⚠️ ${msg}` }
            : item,
        ))
      }
      finally {
        setIsResponding(false)
      }
      return
    }

    // ── Video Generation Mode ──
    if (videoGen) {
      if (!query.trim()) {
        notify({ type: 'info', message: '请输入视频描述' })
        return
      }

      const userMsg: ChatItem = { id: genId(), content: query, isAnswer: false }
      const aiMsgId = genId()
      const aiMsg: ChatItem = { id: aiMsgId, content: '', isAnswer: true }
      setChatList(prev => [...prev, userMsg, aiMsg])
      setIsResponding(true)
      setVideoTaskStatus('提交中...')

      try {
        // Determine if image-to-video: check if files contain an image
        let imageUrl: string | undefined
        let uploadFileId: string | undefined
        let modelId = videoModel.t2v
        if (files && files.length > 0) {
          const imageFile = files.find(f => f.type === 'image' && f.upload_file_id)
          if (imageFile) {
            // Use the uploaded file ID — backend resolves it to a URL
            modelId = videoModel.i2v
            uploadFileId = imageFile.upload_file_id
          }
        }

        const result = await generateVideo(query, modelId, imageUrl, uploadFileId)
        const taskId = result.task_id

        if (!taskId) {
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: '⚠️ 视频生成任务提交失败，未返回任务ID' }
              : item,
          ))
          setIsResponding(false)
          return
        }

        // Poll for results
        setVideoTaskStatus(VIDEO_STATUS_LABELS.PENDING)
        setChatList(prev => prev.map((item, idx) =>
          idx === prev.length - 1 && item.isAnswer
            ? { ...item, content: `🎬 ${VIDEO_STATUS_LABELS.PENDING}` }
            : item,
        ))

        const startTime = Date.now()
        let videoUrl: string | null = null

        while (Date.now() - startTime < VIDEO_POLL_TIMEOUT) {
          await new Promise(resolve => setTimeout(resolve, VIDEO_POLL_INTERVAL))

          try {
            const status = await pollVideoTask(taskId)

            if (status.status === 'SUCCEEDED') {
              videoUrl = status.video_url || null
              setVideoTaskStatus(VIDEO_STATUS_LABELS.SUCCEEDED)
              break
            }
            else if (status.status === 'FAILED') {
              setVideoTaskStatus(VIDEO_STATUS_LABELS.FAILED)
              setChatList(prev => prev.map((item, idx) =>
                idx === prev.length - 1 && item.isAnswer
                  ? { ...item, content: `⚠️ ${status.message || '视频生成失败'}` }
                  : item,
              ))
              break
            }
            else {
              // PENDING or RUNNING — update status text
              const label = VIDEO_STATUS_LABELS[status.status] || '视频生成中...'
              setVideoTaskStatus(label)
              setChatList(prev => prev.map((item, idx) =>
                idx === prev.length - 1 && item.isAnswer
                  ? { ...item, content: `🎬 ${label}` }
                  : item,
              ))
            }
          }
          catch (pollErr: any) {
            console.warn('Video task poll error:', pollErr)
            // Continue polling on transient errors
          }
        }

        if (!videoUrl && Date.now() - startTime >= VIDEO_POLL_TIMEOUT) {
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: '⚠️ 视频生成超时（超过 10 分钟），请稍后在历史记录中查看' }
              : item,
          ))
        }

        if (videoUrl) {
          const modelLabel = modelId.includes('happyhorse') ? 'HappyHorse' : '万相 2.7'
          const hasSourceImage = files?.some(f => f.type === 'image')
          const prefix = hasSourceImage ? '🖼️ 基于上传图片生成视频' : '🎬 已为你生成视频'
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: prefix, generatedVideo: videoUrl!, videoModel: modelLabel }
              : item,
          ))

          // Persist to conversation history
          if (baseAppId) {
            saveVideoMessage(baseAppId, {
              query,
              video_url: videoUrl,
              model: modelId,
              conversation_id: conversationIdRef.current || undefined,
            }).then((res: any) => {
              if (res?.conversation_id)
                conversationIdRef.current = res.conversation_id
              if (res?.message_id)
                lastMessageIdRef.current = res.message_id
              setTimeout(() => fetchHistory(), 300)
            }).catch((err) => {
              console.error('Failed to save video message:', err)
            })
          }
        }
      }
      catch (err: any) {
        const msg = err?.message || '视频生成失败'
        setChatList(prev => prev.map((item, idx) =>
          idx === prev.length - 1 && item.isAnswer
            ? { ...item, content: `⚠️ ${msg}` }
            : item,
        ))
      }
      finally {
        setVideoTaskStatus('')
        setIsResponding(false)
      }
      return
    }

    if (!baseAppId || !selectedModel)
      return

    let searchResults: WebSearchResult[] = []
    if (webSearch) {
      try {
        const searchResponse = await fetchWebSearch(query, 5)
        searchResults = searchResponse?.results || []
        if (!searchResults.length)
          notify({ type: 'warning', message: '联网搜索未返回结果，将基于自身知识回答' })
      }
      catch (err: any) {
        console.error('Web search failed:', err)
        notify({ type: 'error', message: `联网搜索失败: ${err?.message || '服务端点不可用，请检查后端是否已重启'}` })
      }
    }

    // Build document context for system prompt injection
    const docContext = buildDocumentContext(documentTexts || [])
    const docNames = documentTexts?.map(d => d.filename) || []

    const userMsg: ChatItem = {
      id: genId(),
      content: query,
      isAnswer: false,
      files: files?.length ? files : undefined,
      documentNames: docNames.length ? docNames : undefined,
    }
    const aiMsgId = genId()
    const aiMsg: ChatItem = { id: aiMsgId, content: '', isAnswer: true, sources: searchResults.length > 0 ? searchResults : undefined }
    setChatList(prev => [...prev, userMsg, aiMsg])
    setIsResponding(true)

    let accumulatedContent = ''
    // 识图模式：强制使用 qwen3.6-plus 视觉模型，忽略 deepThinking
    const effectiveModel = (visionMode && visionModel)
      ? visionModel
      : selectedModel
    const effectiveDeepThinking = visionMode ? false : deepThinking
    const modelConfig = buildModelConfig(effectiveModel, selectedDatasets, effectiveDeepThinking, searchResults, docContext, visionMode)

    sendChatMessage(baseAppId, {
      query,
      inputs: {},
      model_config: modelConfig,
      conversation_id: conversationIdRef.current || undefined,
      parent_message_id: lastMessageIdRef.current || undefined,
      files: supportsFileUpload && files?.length ? files : undefined,
    }, {
      onData: (messageChunk, isFirstMessage, moreInfo) => {
        if (moreInfo.conversationId && (!conversationIdRef.current || isFirstMessage))
          conversationIdRef.current = moreInfo.conversationId

        if (moreInfo.taskId)
          taskIdRef.current = moreInfo.taskId

        if (moreInfo.messageId)
          lastMessageIdRef.current = moreInfo.messageId

        if (moreInfo.errorMessage) {
          accumulatedContent += `\n\n⚠️ ${moreInfo.errorMessage}`
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: accumulatedContent }
              : item,
          ))
          return
        }

        accumulatedContent += messageChunk
        const currentContent = effectiveDeepThinking ? accumulatedContent : stripThinkTags(accumulatedContent)
        setChatList(prev => prev.map((item, idx) =>
          idx === prev.length - 1 && item.isAnswer
            ? { ...item, content: currentContent }
            : item,
        ))
      },
      onCompleted: () => {
        setIsResponding(false)
        abortControllerRef.current = null
        // 回复完成后刷新历史列表（新会话会出现在数据库中）
        setTimeout(() => fetchHistory(), 300)
      },
      onThought: () => { /* noop */ },
      onFile: () => { /* noop */ },
      onError: () => {
        setIsResponding(false)
        abortControllerRef.current = null
        if (!accumulatedContent) {
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer && !item.content
              ? { ...item, content: '⚠️ 请求出错，请重试' }
              : item,
          ))
        }
      },
      getAbortController: (ctrl) => {
        abortControllerRef.current = ctrl
      },
      onMessageEnd: () => { /* noop */ },
      onMessageReplace: (data) => {
        if (data.answer) {
          accumulatedContent = data.answer
          const finalContent = effectiveDeepThinking ? data.answer : stripThinkTags(data.answer)
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: finalContent }
              : item,
          ))
        }
      },
    })
  }, [baseAppId, selectedModel, selectedDatasets, deepThinking, webSearch, visionMode, visionModel, imageGen, videoGen, videoModel, isResponding, buildModelConfig, stripThinkTags, fetchHistory, supportsFileUpload, notify])

  // ── Stop ──
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    if (baseAppId && taskIdRef.current)
      stopChatMessageResponding(baseAppId, taskIdRef.current).catch(() => { /* noop */ })

    setIsResponding(false)
    abortControllerRef.current = null
  }, [baseAppId])

  // ── Restart ──
  const handleRestart = useCallback(() => {
    conversationIdRef.current = ''
    taskIdRef.current = ''
    lastMessageIdRef.current = ''
    setChatList([])
    setIsResponding(false)
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  return {
    appReady,
    appError,
    retryInit: () => {
      setAppError(null)
      setAppReady(false)
    },
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
    refreshHistory: fetchHistory,
    isVisionModel,
    supportsFileUpload,
    fileUploadConfig,
  }
}
