import { del, get, post, ssePost } from './base'
import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnThought } from './base'
import type { ChatPromptConfig, CompletionPromptConfig } from '@/models/debug'
import type { ModelModeType } from '@/types/app'
import type { ModelParameterRule } from '@/app/components/header/account-setting/model-provider-page/declarations'
export type BasicAppFirstRes = {
  prompt: string
  variables: string[]
  opening_statement: string
  error?: string
}

export type GenRes = {
  modified: string
  message?: string // tip for human
  variables?: string[] // only for basic app first time rule
  opening_statement?: string // only for basic app first time rule
  error?: string
}

export type CodeGenRes = {
  code: string
  language: string[]
  error?: string
}

export const sendChatMessage = async (appId: string, body: Record<string, any>, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace }: {
  onData: IOnData
  onCompleted: IOnCompleted
  onFile: IOnFile
  onThought: IOnThought
  onMessageEnd: IOnMessageEnd
  onMessageReplace: IOnMessageReplace
  onError: IOnError
  getAbortController?: (abortController: AbortController) => void
}) => {
  return ssePost(`apps/${appId}/chat-messages`, {
    body: {
      ...body,
      response_mode: 'streaming',
    },
  }, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace })
}

export const stopChatMessageResponding = async (appId: string, taskId: string) => {
  return post(`apps/${appId}/chat-messages/${taskId}/stop`)
}

/** 保存生图记录到对话历史（不触发 LLM 推理） */
export const saveImageMessage = async (appId: string, body: {
  query: string
  image_urls: string[]
  conversation_id?: string
}) => {
  return post(`apps/${appId}/image-messages`, { body })
}

/** 保存视频生成记录到对话历史（不触发 LLM 推理） */
export const saveVideoMessage = async (appId: string, body: {
  query: string
  video_url: string
  model?: string
  conversation_id?: string
}) => {
  return post(`apps/${appId}/video-messages`, { body })
}

export const sendCompletionMessage = async (appId: string, body: Record<string, any>, { onData, onCompleted, onError, onMessageReplace }: {
  onData: IOnData
  onCompleted: IOnCompleted
  onError: IOnError
  onMessageReplace: IOnMessageReplace
}) => {
  return ssePost(`apps/${appId}/completion-messages`, {
    body: {
      ...body,
      response_mode: 'streaming',
    },
  }, { onData, onCompleted, onError, onMessageReplace })
}

export const fetchSuggestedQuestions = (appId: string, messageId: string, getAbortController?: any) => {
  return get(
    `apps/${appId}/chat-messages/${messageId}/suggested-questions`,
    {},
    {
      getAbortController,
    },
  )
}

export const fetchConversationMessages = (appId: string, conversation_id: string, getAbortController?: any) => {
  return get(`apps/${appId}/chat-messages`, {
    params: {
      conversation_id,
    },
  }, {
    getAbortController,
  })
}

/** 获取应用的会话列表（console API） */
export const fetchChatConversations = (appId: string, params?: {
  page?: number
  limit?: number
  keyword?: string
  sort_by?: string
}) => {
  return get(`apps/${appId}/chat-conversations`, {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 50,
      sort_by: params?.sort_by || '-updated_at',
      ...(params?.keyword ? { keyword: params.keyword } : {}),
    },
  })
}

/** 删除会话（console API） */
export const deleteChatConversation = (appId: string, conversationId: string) => {
  return del(`apps/${appId}/chat-conversations/${conversationId}`)
}

export const generateBasicAppFirstTimeRule = (body: Record<string, any>) => {
  return post<BasicAppFirstRes>('/rule-generate', {
    body,
  })
}

export const generateRule = (body: Record<string, any>) => {
  return post<GenRes>('/instruction-generate', {
    body,
  })
}

export const fetchModelParams = (providerName: string, modelId: string) => {
  return get(`workspaces/current/model-providers/${providerName}/models/parameter-rules`, {
    params: {
      model: modelId,
    },
  }) as Promise<{ data: ModelParameterRule[] }>
}

export const fetchPromptTemplate = ({
  appMode,
  mode,
  modelName,
  hasSetDataSet,
}: { appMode: string; mode: ModelModeType; modelName: string; hasSetDataSet: boolean }) => {
  return get<Promise<{ chat_prompt_config: ChatPromptConfig; completion_prompt_config: CompletionPromptConfig; stop: [] }>>('/app/prompt-templates', {
    params: {
      app_mode: appMode,
      model_mode: mode,
      model_name: modelName,
      has_context: hasSetDataSet,
    },
  })
}

export const fetchTextGenerationMessage = ({
  appId,
  messageId,
}: { appId: string; messageId: string }) => {
  return get<Promise<any>>(`/apps/${appId}/messages/${messageId}`)
}
