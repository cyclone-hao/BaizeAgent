/**
 * 首页 AI 对话助手配置
 */

/** localStorage key: 持久化选中的基础应用 ID */
export const BASE_APP_STORAGE_KEY = 'home-chat-base-app-id'

/** 环境变量配置的全局共享应用 ID（所有用户使用同一个应用） */
export const ENV_HOME_CHAT_APP_ID = process.env.NEXT_PUBLIC_HOME_CHAT_APP_ID || ''

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

// ── 视频生成配置 ──

import type { VideoModel } from '@/service/generate'

/** localStorage key: 持久化选中的视频模型 */
export const VIDEO_MODEL_STORAGE_KEY = 'home-chat-video-model'

/** 视频轮询间隔（毫秒） */
export const VIDEO_POLL_INTERVAL = 5000

/** 视频轮询超时（毫秒，10 分钟） */
export const VIDEO_POLL_TIMEOUT = 600000

/** 视频生成状态文案 */
export const VIDEO_STATUS_LABELS: Record<string, string> = {
  PENDING: '排队中，请稍候...',
  RUNNING: '视频生成中（通常需要 1-5 分钟）...',
  SUCCEEDED: '视频生成完成！',
  FAILED: '视频生成失败',
}

// ── 视频参数配置 ──

/** 视频参数类型 */
export type VideoParams = {
  resolution: string
  duration: number
  ratio: string
  promptExtend: boolean
}

/** 视频参数默认值 */
export const VIDEO_DEFAULTS: VideoParams = {
  resolution: '720P',
  duration: 5,
  ratio: '16:9',
  promptExtend: true,
}

/** localStorage key: 视频参数持久化 */
export const VIDEO_PARAMS_STORAGE_KEY = 'home-chat-video-params'

/** 分辨率选项 */
export const VIDEO_RESOLUTIONS = [
  { value: '480P', label: '480P 标清' },
  { value: '720P', label: '720P 高清' },
  { value: '1080P', label: '1080P 超清' },
] as const

/** 宽高比选项 */
export const VIDEO_RATIOS = [
  { value: '16:9', label: '16:9', desc: '横屏' },
  { value: '9:16', label: '9:16', desc: '竖屏' },
  { value: '1:1', label: '1:1', desc: '方形' },
  { value: '4:3', label: '4:3', desc: '经典' },
  { value: '3:4', label: '3:4', desc: '肖像' },
] as const

/** 时长选项 */
export const VIDEO_DURATIONS = [
  { value: 3, label: '3秒' },
  { value: 5, label: '5秒' },
  { value: 8, label: '8秒' },
  { value: 10, label: '10秒' },
] as const

/** 视频提示词模板 */
export const VIDEO_PROMPT_TEMPLATES = [
  { icon: '🎬', label: '电影感', prompt: '电影级画面质感，浅景深虚化背景，柔和的侧光照射，镜头缓慢推进，画面色调温暖，4K高清画质' },
  { icon: '🌅', label: '自然风光', prompt: '航拍视角俯瞰壮阔山河，云雾缭绕在群山之间，阳光穿透云层洒落金色光芒，镜头缓缓平移，展现大自然的宏伟壮观' },
  { icon: '🏙️', label: '城市延时', prompt: '城市夜景延时摄影，万家灯火闪烁，车流光轨交织成璀璨画卷，高楼大厦矗立其中，星空与城市灯光交相辉映' },
  { icon: '🌊', label: '海洋世界', prompt: '碧蓝海水波光粼粼，浪花翻涌拍打着礁石，阳光穿透水面形成光柱，海底珊瑚色彩斑斓，鱼群穿梭其中' },
  { icon: '🌸', label: '微观特写', prompt: '微距镜头下的花瓣露珠晶莹剔透，晨光照耀下折射出彩虹光芒，镜头极缓慢推进，展现自然界的精致细节' },
  { icon: '🚀', label: '科幻未来', prompt: '未来城市全景，飞行器穿梭在摩天大楼之间，霓虹灯光映射在雨后的街道上，全息投影广告悬浮空中，赛博朋克风格' },
] as const

/** 加载视频参数（从 localStorage） */
export function loadVideoParams(): VideoParams {
  if (typeof window === 'undefined') return { ...VIDEO_DEFAULTS }
  try {
    const raw = localStorage.getItem(VIDEO_PARAMS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...VIDEO_DEFAULTS, ...parsed }
    }
  }
  catch { /* ignore */ }
  return { ...VIDEO_DEFAULTS }
}

/** 保存视频参数到 localStorage */
export function saveVideoParams(params: VideoParams) {
  localStorage.setItem(VIDEO_PARAMS_STORAGE_KEY, JSON.stringify(params))
}
