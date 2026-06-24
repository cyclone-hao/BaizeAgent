'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '@/app/components/base/toast'
import {
  chatWithWorkflowBuilder,
  type WorkflowBuilderMessage,
  type WorkflowJson,
} from '@/service/workflow-builder'
import { createApp } from '@/service/apps'
import { syncWorkflowDraft } from '@/service/workflow'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  workflowJson?: WorkflowJson | null
}

export function useWorkflowBuilder() {
  const { t } = useTranslation()
  const router = useRouter()
  const { notify } = useToastContext()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowJson | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: content.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Build history for API
      const history: WorkflowBuilderMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      // Call workflow builder API
      const response = await chatWithWorkflowBuilder(content.trim(), history)

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.message,
        workflowJson: response.workflow_json,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update current workflow if JSON was generated
      if (response.workflow_json) {
        setCurrentWorkflow(response.workflow_json)
      }
    } catch (error) {
      console.error('Workflow builder chat error:', error)
      const errorMessage = error instanceof Error ? error.message : '对话失败，请稍后重试'
      notify({ type: 'error', message: `请求超时或失败：${errorMessage}` })

      const errorChatMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: '抱歉，请求超时或出现错误。请稍后重试，或尝试简化工作流描述。',
      }
      setMessages(prev => [...prev, errorChatMessage])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading])

  const createWorkflow = useCallback(async () => {
    if (!currentWorkflow) {
      notify({ type: 'error', message: '没有可用的工作流设计' })
      return
    }

    setIsCreating(true)

    try {
      // Step 1: Create app
      console.log('Creating app with:', {
        name: currentWorkflow.app_name,
        description: currentWorkflow.description || '',
        mode: currentWorkflow.app_mode || 'workflow',
      })

      let app
      try {
        app = await createApp({
          name: currentWorkflow.app_name,
          description: currentWorkflow.description || '',
          mode: currentWorkflow.app_mode || 'workflow',
        })
        console.log('App created:', app)
      } catch (createAppError) {
        console.error('Step 1 (createApp) failed:', createAppError)
        throw new Error(`创建应用失败: ${createAppError instanceof Error ? createAppError.message : String(createAppError)}`)
      }

      // Step 2: Sync workflow draft
      console.log('Syncing workflow draft:', {
        url: `apps/${app.id}/workflows/draft`,
        params: {
          graph: currentWorkflow.graph,
          features: {},
          environment_variables: [],
          conversation_variables: [],
        },
      })

      try {
        await syncWorkflowDraft({
          url: `apps/${app.id}/workflows/draft`,
          params: {
            graph: currentWorkflow.graph,
            features: {},
            environment_variables: [],
            conversation_variables: [],
          },
        })
        console.log('Workflow draft synced')
      } catch (syncError) {
        console.error('Step 2 (syncWorkflowDraft) failed:', syncError)
        throw new Error(`同步工作流失败: ${syncError instanceof Error ? syncError.message : String(syncError)}`)
      }

      // Step 3: Redirect to workflow editor
      notify({ type: 'success', message: '工作流创建成功！' })
      router.push(`/app/${app.id}/workflow`)
    } catch (error) {
      console.error('Create workflow error:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)

      let errorMessage = ''

      // Try to extract error message from various error types
      if (error && typeof error === 'object') {
        // Check if it's a Response object
        if (error instanceof Response || error.constructor?.name === 'Response') {
          try {
            const errorData = await error.json()
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
            console.error('API error response:', errorData)
          } catch {
            errorMessage = `HTTP ${error.status || 'unknown'}: ${error.statusText || 'unknown'}`
          }
        }
        // Check if it's an Error object
        else if (error instanceof Error) {
          errorMessage = error.message
        }
        // Try to stringify other objects
        else {
          try {
            errorMessage = JSON.stringify(error)
          } catch {
            errorMessage = String(error)
          }
        }
      } else {
        errorMessage = String(error)
      }

      notify({ type: 'error', message: `创建工作流失败：${errorMessage || '未知错误，请查看控制台'}` })
    } finally {
      setIsCreating(false)
    }
  }, [currentWorkflow, router, notify])

  const resetConversation = useCallback(() => {
    setMessages([])
    setCurrentWorkflow(null)
  }, [])

  return {
    messages,
    isLoading,
    currentWorkflow,
    isCreating,
    sendMessage,
    createWorkflow,
    resetConversation,
  }
}
