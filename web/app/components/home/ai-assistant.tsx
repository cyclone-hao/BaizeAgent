'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { RiRobot2Line, RiSendPlane2Fill, RiStopCircleFill } from '@remixicon/react'
import { useHomeChat } from './home-chat/use-home-chat'
import { HOME_CHAT_APP_ID } from './home-chat/config'
import ChatToggles from './home-chat/chat-toggles'
import AppSelector from './app-selector'
import { Markdown } from '@/app/components/base/markdown'
import Button from '@/app/components/base/button'
import { useToastContext } from '@/app/components/base/toast'
import cn from '@/utils/classnames'

const SELECTED_APP_STORAGE_KEY = 'home-chat-selected-app-id'

const AiAssistant = () => {
  const { notify } = useToastContext()
  const [deepThinking, setDeepThinking] = useState(false)
  const [smartSearch, setSmartSearch] = useState(false)
  const [query, setQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // App selection: env var takes priority, then localStorage
  const [selectedAppId, setSelectedAppId] = useState(() => {
    if (typeof window === 'undefined')
      return ''
    return localStorage.getItem(SELECTED_APP_STORAGE_KEY) || ''
  })

  const handleAppChange = useCallback((appId: string) => {
    setSelectedAppId(appId)
    localStorage.setItem(SELECTED_APP_STORAGE_KEY, appId)
  }, [])

  const effectiveAppId = HOME_CHAT_APP_ID || selectedAppId
  const needsAppSelection = !HOME_CHAT_APP_ID

  const {
    chatList,
    sendMessage,
    handleStop,
    isResponding,
    handleRestart,
  } = useHomeChat({ deepThinking, smartSearch }, effectiveAppId || undefined)

  const hasMessages = chatList.length > 0
  const isConfigured = !!effectiveAppId

  const handleSend = useCallback(() => {
    if (isResponding || !isConfigured)
      return
    if (!query.trim()) {
      notify({ type: 'info', message: '请输入消息内容' })
      return
    }
    sendMessage(query.trim())
    setQuery('')
    if (textareaRef.current)
      textareaRef.current.style.height = 'auto'
  }, [query, isResponding, isConfigured, sendMessage, notify])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposingRef.current)
        return
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (hasMessages)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatList.length, chatList[chatList.length - 1]?.content, hasMessages])

  return (
    <div className="mb-8">
      {/* AI Assistant Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-util-colors-indigo-indigo-50">
            <RiRobot2Line className="h-4 w-4 text-primary-600" />
          </div>
          <h2 className="text-base font-semibold text-text-secondary">AI 助手</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* App selector: only shown when env var is not configured */}
          {needsAppSelection && (
            <AppSelector value={selectedAppId} onChange={handleAppChange} />
          )}
          {hasMessages && (
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-text-quaternary transition-colors hover:bg-state-base-hover hover:text-text-secondary"
              onClick={() => handleRestart()}
            >
              新对话
            </button>
          )}
        </div>
      </div>

      {/* Unconfigured hint */}
      {!isConfigured && (
        <div className="mb-3 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-600">
          请在右上角选择对话应用，或配置环境变量 NEXT_PUBLIC_HOME_CHAT_APP_ID
        </div>
      )}

      {/* Chat Input Card */}
      <div className="rounded-xl border border-components-panel-border bg-components-panel-on-panel-item-bg shadow-sm">
        <ChatToggles
          deepThinking={deepThinking}
          smartSearch={smartSearch}
          onDeepThinkingChange={setDeepThinking}
          onSmartSearchChange={setSmartSearch}
          disabled={isResponding}
        />
        <div className="px-3 pb-2">
          <Textarea
            ref={textareaRef}
            className={cn(
              'w-full resize-none bg-transparent py-2 text-sm text-text-primary outline-none',
              'placeholder:text-text-quaternary',
            )}
            placeholder={isConfigured ? '输入消息，开始对话...' : '请先选择对话应用'}
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
            disabled={isResponding || !isConfigured}
          />
        </div>
        <div className="flex items-center justify-end px-3 pb-2">
          {isResponding
            ? (
              <Button className="!h-8 !w-8 !p-0" onClick={handleStop}>
                <RiStopCircleFill className="h-4 w-4" />
              </Button>
            )
            : (
              <Button
                className="!h-8 !w-8 !p-0"
                variant="primary"
                onClick={handleSend}
                disabled={!query.trim() || !isConfigured}
              >
                <RiSendPlane2Fill className="h-4 w-4" />
              </Button>
            )}
        </div>
      </div>

      {/* Message Flow */}
      {hasMessages && (
        <div className="mt-4 max-h-[500px] overflow-y-auto rounded-xl border border-divider-subtle bg-background-body p-4">
          {chatList.map((item, index) => {
            if (item.isAnswer) {
              const isLast = index === chatList.length - 1
              return (
                <div key={item.id} className="mb-4 flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-util-colors-indigo-indigo-50">
                    <RiRobot2Line className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="min-w-0 max-w-[85%]">
                    {item.content
                      ? (
                        <div className="rounded-2xl rounded-tl-sm bg-components-panel-on-panel-item-bg px-4 py-2.5">
                          <Markdown content={item.content} className="!text-sm" />
                        </div>
                      )
                      : (
                        isLast && isResponding && (
                          <div className="rounded-2xl rounded-tl-sm bg-components-panel-on-panel-item-bg px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-quaternary" style={{ animationDelay: '0ms' }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-quaternary" style={{ animationDelay: '150ms' }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-quaternary" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )
                      )}
                  </div>
                </div>
              )
            }
            return (
              <div key={item.id} className="mb-4 flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary-600 px-4 py-2.5 text-sm text-white">
                  <div className="whitespace-pre-wrap break-words">{item.content}</div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

    </div>
  )
}

export default AiAssistant
