'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProviderContext } from '@/context/provider-context'
import {
  ModelStatusEnum,
} from '@/app/components/header/account-setting/model-provider-page/declarations'
import type { Model as ModelGroup } from '@/app/components/header/account-setting/model-provider-page/declarations'
import { createApp } from '@/service/apps'
import { sendChatMessage, stopChatMessageResponding } from '@/service/debug'
import { get } from '@/service/base'
import { fetchWebSearch } from '@/service/web-search'
import type { WebSearchResult } from '@/service/web-search'
import type { AppDetailResponse } from '@/models/app'
import {
  BASE_APP_STORAGE_KEY,
  DATASET_STORAGE_KEY,
  DEFAULT_COMPLETION_PARAMS,
  DEFAULT_SYSTEM_PROMPT,
  HISTORY_MAX_ITEMS,
  HISTORY_STORAGE_KEY,
  MODEL_STORAGE_KEY,
  getReasoningParams,
  isReasoningModel,
} from './config'

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

export type HistoryEntry = {
  id: string
  conversationId: string
  title: string
  messages: ChatItem[]
  createdAt: number
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

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined')
    return []
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  }
  catch { return [] }
}

function saveHistoryList(entries: HistoryEntry[]) {
  if (entries.length)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
  else
    localStorage.removeItem(HISTORY_STORAGE_KEY)
}

// ── Hook ───────────────────────────────────────────

export function useChatAssistant() {
  const { textGenerationModelList } = useProviderContext()

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
      // Step 1: Check localStorage cache
      const cached = localStorage.getItem(BASE_APP_STORAGE_KEY)
      if (cached) {
        // Step 2: Validate cached app ID still exists
        try {
          await get<AppDetailResponse>(`apps/${cached}`)
          setBaseAppId(cached)
          setAppReady(true)
          return
        }
        catch {
          // Cached app was deleted, clear and recreate
          localStorage.removeItem(BASE_APP_STORAGE_KEY)
        }
      }

      // Step 3: Create new base app
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

  // Auto-select first model if none selected
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
  const conversationIdRef = useRef('')
  const taskIdRef = useRef('')
  const lastMessageIdRef = useRef('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // ── History ──
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())

  const saveCurrentToHistory = useCallback(() => {
    const currentList = chatListRef.current
    if (!currentList.length)
      return
    const conversationId = conversationIdRef.current
    // 没有 conversationId 说明对话尚未建立，跳过保存
    if (!conversationId)
      return
    // 至少需要一轮问答（一条用户消息 + 一条 AI 回复）
    const userMessages = currentList.filter(m => !m.isAnswer)
    if (!userMessages.length)
      return
    const aiMessages = currentList.filter(m => m.isAnswer && m.content)
    if (!aiMessages.length)
      return

    const title = userMessages[0].content.slice(0, 30) || '对话'
    const entry: HistoryEntry = {
      id: `hist_${Date.now()}`,
      conversationId,
      title,
      messages: currentList,
      createdAt: Date.now(),
    }

    setHistory((prev) => {
      // 清理历史遗留的空 conversationId 条目（旧 bug 产生的幽灵数据）
      const cleaned = prev.filter(e => e.conversationId)

      // 如果最后一条是同一对话，直接原地更新（最常见场景）
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].conversationId === conversationId) {
        const updated = [...cleaned]
        updated[updated.length - 1] = { ...entry, id: cleaned[cleaned.length - 1].id }
        const final = updated.length > HISTORY_MAX_ITEMS ? updated.slice(0, HISTORY_MAX_ITEMS) : updated
        saveHistoryList(final)
        return final
      }

      // 查找是否已有同一对话的旧条目（非最后一条的情况）
      const existingIdx = cleaned.findIndex(e => e.conversationId === conversationId)
      if (existingIdx >= 0) {
        const updated = cleaned.filter((_, i) => i !== existingIdx)
        updated.unshift({ ...entry, id: cleaned[existingIdx].id })
        const final = updated.length > HISTORY_MAX_ITEMS ? updated.slice(0, HISTORY_MAX_ITEMS) : updated
        saveHistoryList(final)
        return final
      }

      // 新对话，添加到最前
      const updated = [entry, ...cleaned]
      const final = updated.length > HISTORY_MAX_ITEMS ? updated.slice(0, HISTORY_MAX_ITEMS) : updated
      saveHistoryList(final)
      return final
    })
  }, [])

  const loadConversation = useCallback((entry: HistoryEntry) => {
    setChatList(entry.messages)
    conversationIdRef.current = entry.conversationId
    lastMessageIdRef.current = ''
    taskIdRef.current = ''
    abortControllerRef.current = null
    setIsResponding(false)
  }, [])

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter(e => e.id !== id)
      saveHistoryList(updated)
      return updated
    })
  }, [])

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

  // ── Build model_config ──
  const buildModelConfig = useCallback((
    model: ModelSelection,
    datasets: DatasetSelection[],
    useDeepThinking: boolean,
    searchResults: WebSearchResult[] = [],
  ) => {
    // 构建 completion_params，若选中深度思考且为推理模型，追加厂商专属推理参数
    const completionParams: Record<string, unknown> = { ...DEFAULT_COMPLETION_PARAMS }
    if (useDeepThinking && isReasoningModel(model.model)) {
      const reasoningParams = getReasoningParams(model.model)
      if (reasoningParams)
        Object.assign(completionParams, reasoningParams)
    }

    // 构建 system prompt，注入搜索结果上下文
    const prePrompt = DEFAULT_SYSTEM_PROMPT + buildSearchContext(searchResults)

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
      file_upload: { image: { enabled: false } },
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
  }, [buildSearchContext])

  // ── Strip </think> tags when deep thinking is off ──
  // 推理模型默认输出 </think>，未选中深度思考时需要剥离
  const stripThinkTags = useCallback((content: string) => {
    return content
      .replace(/<think>[\s\S]*?<\/think>/g, '') // 完整的 </think> 块
      .replace(/<think>[\s\S]*$/, '') // 流式传输中未闭合的 <think> 块
      .trim()
  }, [])

  // ── Send Message ──
  const sendMessage = useCallback(async (query: string) => {
    if (!baseAppId || !selectedModel || isResponding)
      return

    // 如果启用联网搜索，先调用搜索 API 获取结果
    let searchResults: WebSearchResult[] = []
    if (webSearch) {
      try {
        const searchResponse = await fetchWebSearch(query, 5)
        searchResults = searchResponse?.results || []
      }
      catch (err) {
        console.error('Web search failed:', err)
        // 搜索失败不阻塞对话，继续普通模式
      }
    }

    // Add user message and AI placeholder
    const userMsg: ChatItem = { id: genId(), content: query, isAnswer: false }
    const aiMsgId = genId()
    const aiMsg: ChatItem = { id: aiMsgId, content: '', isAnswer: true, sources: searchResults.length > 0 ? searchResults : undefined }
    setChatList(prev => [...prev, userMsg, aiMsg])
    setIsResponding(true)

    // Accumulate streamed content outside React state to avoid
    // double-invocation issues in React strict mode / concurrent features
    let accumulatedContent = ''

    const modelConfig = buildModelConfig(selectedModel, selectedDatasets, deepThinking, searchResults)

    sendChatMessage(baseAppId, {
      query,
      inputs: {},
      model_config: modelConfig,
      conversation_id: conversationIdRef.current || undefined,
      parent_message_id: lastMessageIdRef.current || undefined,
    }, {
      onData: (messageChunk, isFirstMessage, moreInfo) => {
        // Capture conversation_id for subsequent messages in the same conversation
        if (moreInfo.conversationId && (!conversationIdRef.current || isFirstMessage))
          conversationIdRef.current = moreInfo.conversationId

        if (moreInfo.taskId)
          taskIdRef.current = moreInfo.taskId

        // Track message ID for parent_message_id threading
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

        // Append chunk to accumulator and update state immutably
        accumulatedContent += messageChunk
        // 当深度思考未开启时，剥离 </think> 标签内容再显示
        const currentContent = deepThinking ? accumulatedContent : stripThinkTags(accumulatedContent)
        setChatList(prev => prev.map((item, idx) =>
          idx === prev.length - 1 && item.isAnswer
            ? { ...item, content: currentContent }
            : item,
        ))
      },
      onCompleted: () => {
        setIsResponding(false)
        abortControllerRef.current = null
        // AI 回复完成后自动保存到历史（延迟执行以确保 chatList 已更新）
        setTimeout(() => saveCurrentToHistory(), 100)
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
          const finalContent = deepThinking ? data.answer : stripThinkTags(data.answer)
          setChatList(prev => prev.map((item, idx) =>
            idx === prev.length - 1 && item.isAnswer
              ? { ...item, content: finalContent }
              : item,
          ))
        }
      },
    })
  }, [baseAppId, selectedModel, selectedDatasets, deepThinking, webSearch, isResponding, buildModelConfig, stripThinkTags])

  // ── Stop ──
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    if (baseAppId && taskIdRef.current)
      stopChatMessageResponding(baseAppId, taskIdRef.current).catch(() => { /* noop */ })

    setIsResponding(false)
    abortControllerRef.current = null
  }, [baseAppId])

  // ── Restart (save current to history, then clear) ──
  const handleRestart = useCallback(() => {
    saveCurrentToHistory()
    conversationIdRef.current = ''
    taskIdRef.current = ''
    lastMessageIdRef.current = ''
    setChatList([])
    setIsResponding(false)
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [saveCurrentToHistory])

  return {
    // App
    appReady,
    appError,
    retryInit: () => {
      setAppError(null)
      setAppReady(false)
    },

    // Models
    availableModels,
    selectedModel,
    setSelectedModel,

    // Datasets
    selectedDatasets,
    setSelectedDatasets,

    // Chat
    chatList,
    isResponding,
    deepThinking,
    setDeepThinking,
    webSearch,
    setWebSearch,
    sendMessage,
    handleStop,
    handleRestart,

    // History
    history,
    loadConversation,
    deleteHistoryItem,
  }
}
