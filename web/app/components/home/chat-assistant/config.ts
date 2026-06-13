/**
 * 首页 AI 对话助手配置
 */

/** localStorage key: 持久化选中的基础应用 ID */
export const BASE_APP_STORAGE_KEY = 'home-chat-base-app-id'

/** localStorage key: 持久化选中的模型 */
export const MODEL_STORAGE_KEY = 'home-chat-selected-model'

/** localStorage key: 持久化选中的知识库 */
export const DATASET_STORAGE_KEY = 'home-chat-selected-datasets'

/** localStorage key: 对话历史记录 */
export const HISTORY_STORAGE_KEY = 'home-chat-history'

/** 历史记录最大保存数量 */
export const HISTORY_MAX_ITEMS = 50

/** 默认系统提示词 */
export const DEFAULT_SYSTEM_PROMPT
  = '你是一个智能助手，请用简洁清晰的方式回答用户的问题。如果提供了参考资料，请优先基于参考资料回答。'

/**
 * 判断模型是否为推理（Reasoning）模型
 * 根据模型名称关键词匹配，覆盖 DeepSeek / Qwen / Kimi / MiniMax / GLM 五大厂商
 */
export function isReasoningModel(modelName: string): boolean {
  const name = modelName.toLowerCase()
  const reasoningKeywords = [
    'r1', // DeepSeek-R1
    'qwq', // QwQ-32B, QwQ-Max
    'kimi-k2', // Kimi-K2, Kimi-K2-Thinking
    'glm-4.5', // GLM-4.5
  ]
  return reasoningKeywords.some(keyword => name.includes(keyword))
}

/**
 * 根据模型名称获取对应的推理参数（completion_params 扩展字段）
 * 各厂商推理模型需要传入不同参数名来激活思考模式
 */
export function getReasoningParams(modelName: string): Record<string, unknown> | null {
  const name = modelName.toLowerCase()

  // DeepSeek-R1: thinking: { type: "enabled" }
  if (name.includes('r1'))
    return { thinking: { type: 'enabled' } }

  // QwQ: enable_thinking: true
  if (name.includes('qwq'))
    return { enable_thinking: true }

  // Kimi-K2: thinking: { type: "enabled" }
  if (name.includes('kimi-k2'))
    return { thinking: { type: 'enabled' } }

  // GLM-4.5: thinking: { type: "enabled" }
  if (name.includes('glm-4.5'))
    return { thinking: { type: 'enabled' } }

  return null
}

/** 默认模型参数 */
export const DEFAULT_COMPLETION_PARAMS = {
  temperature: 0.7,
  max_tokens: 4096,
}

/** 建议问题 */
export const SUGGESTED_QUESTIONS = [
  { icon: '✉️', text: '帮我写一封工作邮件' },
  { icon: '💡', text: '解释一个技术概念' },
  { icon: '🔍', text: '帮我分析一段代码' },
  { icon: '🌐', text: '翻译一段文字' },
]
