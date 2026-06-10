/**
 * 首页对话窗口配置
 *
 * HOME_CHAT_APP_ID: 对话窗口使用的 Dify 已安装应用 ID
 * 需要在 Dify 管理后台创建一个 agent-chat 类型的应用并安装
 * 该应用应配置 deep_thinking(bool) 和 web_search(bool) 两个 input variables
 */
export const HOME_CHAT_APP_ID = process.env.NEXT_PUBLIC_HOME_CHAT_APP_ID || ''

/** 功能开关 */
export const HOME_CHAT_FEATURES = {
  deepThinking: true,
  smartSearch: true,
  imageUpload: false,
  imageGeneration: false,
} as const

/** 显示文本 */
export const HOME_CHAT_LABELS = {
  deepThinking: '深度思考',
  smartSearch: '智能搜索',
  placeholder: '输入消息，开始对话...',
  welcomeTitle: 'AI 助手',
  welcomeDescription: '有什么我可以帮你的？试试问我任何问题。',
  headerTitle: 'AI 对话',
  newConversation: '新对话',
} as const
