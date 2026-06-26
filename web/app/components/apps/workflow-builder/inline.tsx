'use client'

import React, { useEffect, useRef, useState } from 'react'
import { RiArrowDownSLine, RiArrowLeftLine, RiLoader2Line, RiRefreshLine, RiSendPlaneFill, RiSparklingFill } from '@remixicon/react'
import Button from '@/app/components/base/button'
import { useWorkflowBuilder } from './use-workflow-builder'
import WorkflowPreview from './workflow-preview'
import cn from '@/utils/classnames'

type WorkflowBuilderInlineProps = {
  onBack: () => void
}

const WorkflowBuilderInline: React.FC<WorkflowBuilderInlineProps> = ({
  onBack,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [loadingExpanded, setLoadingExpanded] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    isLoading,
    currentWorkflow,
    isCreating,
    sendMessage,
    createWorkflow,
    resetConversation,
  } = useWorkflowBuilder()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputValue])

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return
    sendMessage(inputValue)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCreateWorkflow = async () => {
    await createWorkflow()
  }

  const handleReset = () => {
    resetConversation()
    setInputValue('')
  }

  return (
    <div className="flex h-full flex-col">
      <style>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-divider-subtle px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-tertiary hover:bg-state-base-hover hover:text-text-secondary"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
            <RiSparklingFill className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">
            AI 自动编排智能体
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            disabled={isLoading || messages.length === 0}
          >
            <RiRefreshLine className="h-4 w-4" />
            <span className="ml-1">重新开始</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="flex flex-1 flex-col border-r border-divider-subtle">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200">
                  <RiSparklingFill className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="mb-2 text-lg font-semibold text-text-primary">
                  欢迎使用 AI 自动编排智能体
                </h4>
                <p className="max-w-md text-sm text-text-secondary">
                  描述您想要创建的智能体，AI 将帮助您设计并生成完整的工作流配置。
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <p className="text-xs font-medium text-text-tertiary">示例：</p>
                  <button
                    onClick={() => setInputValue('我想创建一个能回答产品问题的客服智能体')}
                    className="rounded-lg border border-components-panel-border bg-components-panel-bg px-4 py-2 text-left text-sm text-text-secondary hover:bg-state-base-hover"
                  >
                    我想创建一个能回答产品问题的客服智能体
                  </button>
                  <button
                    onClick={() => setInputValue('帮我设计一个自动化邮件处理流程，能分类邮件并自动回复')}
                    className="rounded-lg border border-components-panel-border bg-components-panel-bg px-4 py-2 text-left text-sm text-text-secondary hover:bg-state-base-hover"
                  >
                    帮我设计一个自动化邮件处理流程，能分类邮件并自动回复
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-components-chat-bubble-bg text-text-primary'
                      )}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="max-w-[80%] rounded-2xl bg-components-chat-bubble-bg px-4 py-3">
                      <div
                        className="flex cursor-pointer items-center gap-3"
                        onClick={() => setLoadingExpanded(!loadingExpanded)}
                      >
                        <RiLoader2Line className="h-5 w-5 shrink-0 animate-spin text-primary-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              AI 正在设计工作流...
                            </span>
                            <RiArrowDownSLine
                              className={cn(
                                'h-4 w-4 text-text-tertiary transition-transform duration-200',
                                loadingExpanded ? 'rotate-180' : ''
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      {loadingExpanded && (
                        <div className="mt-2">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-divider-subtle">
                            <div
                              className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400"
                              style={{ animation: 'progress-slide 2s ease-in-out infinite' }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-text-tertiary">
                            预计需要 30-60 秒，请稍候
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-divider-subtle px-6 py-4">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述您想要创建的智能体..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-components-input-border-active bg-components-input-bg-active px-3 py-2 text-sm text-text-primary placeholder:text-text-quaternary focus:border-components-input-border-active-hover focus:outline-none"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                variant="primary"
              >
                <RiSendPlaneFill className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex w-96 flex-col overflow-y-auto p-6">
          <h4 className="mb-3 text-sm font-semibold text-text-primary">
            工作流预览
          </h4>
          {currentWorkflow ? (
            <div>
              <WorkflowPreview workflow={currentWorkflow} />
              <div className="mt-4">
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={isCreating}
                  variant="primary"
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <RiLoader2Line className="h-4 w-4 animate-spin" />
                      <span className="ml-2">创建中...</span>
                    </>
                  ) : (
                    '创建工作流'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-components-panel-border bg-components-panel-bg p-8 text-center">
              <p className="text-sm text-text-tertiary">
                与 AI 对话后，工作流设计将在这里显示
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkflowBuilderInline
