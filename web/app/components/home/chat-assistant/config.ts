/**
 * 首页 AI 对话助手配置
 */

/** localStorage key: 持久化选中的基础应用 ID */
export const BASE_APP_STORAGE_KEY = 'home-chat-base-app-id'

/** localStorage key: 持久化选中的模型 */
export const MODEL_STORAGE_KEY = 'home-chat-selected-model'

/** localStorage key: 持久化选中的知识库 */
export const DATASET_STORAGE_KEY = 'home-chat-selected-datasets'

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

/** 文件上传限制 */
export const FILE_UPLOAD_LIMITS = {
  maxFiles: 5,
  imageMaxSize: 10 * 1024 * 1024, // 10 MB
  docMaxSize: 15 * 1024 * 1024, // 15 MB
}

/** 识图助手固定使用的视觉模型名称 */
export const VISION_MODEL_NAME = 'qwen3.6-plus'

/** 识图助手专用系统提示词 */
export const VISION_SYSTEM_PROMPT
  = '你是一个专业的图像识别与分析助手。请仔细观察用户上传的图片，并结合用户的文字描述进行准确分析。\n\n'
  + '分析能力：\n'
  + '- 文字识别（OCR）：准确识别图片中的文字内容\n'
  + '- 物体识别：识别图片中的人物、动物、物品等\n'
  + '- 图表分析：解读图表、数据可视化内容\n'
  + '- 场景描述：详细描述图片中的场景、环境和氛围\n'
  + '- 专业分析：根据图片内容提供专业见解\n\n'
  + '回答要求：\n'
  + '- 先描述图片整体内容\n'
  + '- 针对用户的具体问题进行详细回答\n'
  + '- 如果图片包含文字，优先提取和整理文字内容\n'
  + '- 使用清晰的结构化格式（如需要可用列表或标题）\n'
  + '- 如果图片模糊或无法识别，请如实说明'

/**
 * 在可用模型列表中查找识图专用视觉模型
 * 使用模糊匹配，兼容版本后缀（如 qwen3.6-plus-latest）
 */
export function findVisionModel(
  availableModels: { provider: string; model: string; mode: string }[],
): { provider: string; model: string; mode: string } | null {
  const target = VISION_MODEL_NAME.toLowerCase()
  const found = availableModels.find(m => m.model.toLowerCase().includes(target))
  return found ? { provider: found.provider, model: found.model, mode: found.mode } : null
}
