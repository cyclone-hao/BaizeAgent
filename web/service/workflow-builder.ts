import { post } from './base'

export type WorkflowBuilderMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type WorkflowBuilderResponse = {
  message: string
  workflow_json: WorkflowJson | null
}

export type WorkflowNode = {
  id: string
  type: 'custom'
  position: { x: number; y: number }
  width: number
  height: number
  data: {
    type: string
    title: string
    [key: string]: any
  }
}

export type WorkflowEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export type WorkflowJson = {
  app_name: string
  app_mode: 'workflow' | 'advanced-chat'
  description?: string
  graph: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
}

export const chatWithWorkflowBuilder = (message: string, history: WorkflowBuilderMessage[] = []) => {
  return post<WorkflowBuilderResponse>('/workflow-builder/chat', {
    body: { message, history },
  }, { silent: true })
}
