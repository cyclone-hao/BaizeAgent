'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useChat } from '@/app/components/base/chat/chat/hooks'
import type { ChatConfig } from '@/app/components/base/chat/types'
import { getUrl, stopChatMessageResponding } from '@/service/share'
import { HOME_CHAT_APP_ID } from './config'

type HomeChatOptions = {
  deepThinking: boolean
  smartSearch: boolean
}

export function useHomeChat(options: HomeChatOptions, appId?: string) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const effectiveAppId = appId || HOME_CHAT_APP_ID
  const appIdRef = useRef(effectiveAppId)
  useEffect(() => {
    appIdRef.current = effectiveAppId
  }, [effectiveAppId])

  const config = useMemo<ChatConfig>(() => ({
    system_parameters: {
      audio_file_size_limit: 0,
      file_size_limit: 0,
      image_file_size_limit: 0,
      video_file_size_limit: 0,
      workflow_file_upload_limit: 0,
    },
    more_like_this: { enabled: false },
    supportFeedback: false,
    questionEditEnable: false,
    supportAnnotation: false,
    supportCitationHitInfo: false,
  } as unknown as ChatConfig), [])

  const {
    chatList,
    handleSend: rawHandleSend,
    handleStop,
    isResponding,
    handleRestart,
  } = useChat(
    config,
    undefined,
    undefined,
    (taskId: string) => stopChatMessageResponding('', taskId, true, appIdRef.current),
  )

  const sendMessage = useCallback((message: string) => {
    if (!effectiveAppId)
      return

    const url = getUrl('chat-messages', true, effectiveAppId)

    rawHandleSend(
      url,
      {
        query: message,
        inputs: {
          deep_thinking: optionsRef.current.deepThinking,
          web_search: optionsRef.current.smartSearch,
        },
      },
      {
        isPublicAPI: false,
      },
    )
  }, [rawHandleSend, effectiveAppId])

  return {
    chatList,
    sendMessage,
    handleStop,
    isResponding,
    handleRestart,
  }
}
