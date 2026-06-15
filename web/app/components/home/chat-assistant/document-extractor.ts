/**
 * 文档文本提取工具
 *
 * 在前端（浏览器）提取 PDF / DOCX / 纯文本文件的文本内容，
 * 提取结果注入到系统提示词中供模型分析，不依赖后端文件上传管线。
 *
 * 图片型 PDF（扫描件）自动检测并渲染页面为图片，
 * 通过视觉模型的图片分析能力分析。
 *
 * - PDF  → pdfjs-dist（动态加载，首次使用时初始化 worker）
 * - DOCX → mammoth（动态加载）
 * - TXT / MD / CSV / JSON → FileReader
 */

// ── 常量 ──────────────────────────────────────────

/** 提取文本的最大字符数，超出则截断并提示用户 */
const MAX_CHARS = 30_000

/** 每页平均文本字符数低于此值则判定为图片型 PDF */
const IMAGE_BASED_THRESHOLD = 20

/** 图片型 PDF 最多渲染的页数（与视觉模型 number_limits 一致） */
const MAX_RENDER_PAGES = 3

/** 渲染缩放比例（2x 保证 HiDPI 清晰度） */
const RENDER_SCALE = 2

/** 支持的文件扩展名 → 类型映射 */
const DOC_EXTENSIONS: Record<string, 'pdf' | 'docx' | 'text'> = {
  pdf: 'pdf',
  docx: 'docx',
  doc: 'docx', // .doc 旧格式，mammoth 部分支持
  txt: 'text',
  md: 'text',
  csv: 'text',
  json: 'text',
  log: 'text',
  xml: 'text',
  yaml: 'text',
  yml: 'text',
}

export type ExtractionResult = {
  text: string
  truncated: boolean
  charCount: number
  /** 是否为图片型 PDF（文本密度低于阈值） */
  isImageBased: boolean
  /** PDF 总页数（仅 PDF 文件） */
  pageCount: number
  /** 渲染的页面图片文件（仅图片型 PDF，最多 MAX_RENDER_PAGES 张） */
  pageImages?: File[]
}

// ── PDF 提取 ──────────────────────────────────────

let pdfjsWorkerInitialized = false

async function initPdfjsWorker() {
  if (pdfjsWorkerInitialized)
    return

  // 动态导入 pdfjs-dist（避免 SSR 和首屏加载开销）
  const pdfjsLib = await import('pdfjs-dist')

  // 指向 public/ 目录下的 worker 文件（从 node_modules 复制而来）
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  pdfjsWorkerInitialized = true
}

/**
 * 渲染 PDF 页面为 JPEG 图片文件
 * 用于图片型 PDF（扫描件），通过视觉模型分析
 */
async function renderPdfPages(file: File, maxPages = MAX_RENDER_PAGES, scale = RENDER_SCALE): Promise<File[]> {
  await initPdfjsWorker()
  const pdfjsLib = await import('pdfjs-dist')

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const images: File[] = []
  const pageCount = Math.min(pdf.numPages, maxPages)

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvas, viewport }).promise

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (blob)
      images.push(new File([blob], `${file.name}-page${i}.jpg`, { type: 'image/jpeg' }))
  }

  pdf.cleanup()
  return images
}

/**
 * 提取 PDF 文本并检测是否为图片型 PDF
 * 返回文本、页数和图片型标记
 */
async function extractPdfWithMeta(file: File): Promise<{
  text: string
  pageCount: number
  isImageBased: boolean
  pageImages?: File[]
}> {
  await initPdfjsWorker()
  const pdfjsLib = await import('pdfjs-dist')

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const numPages = pdf.numPages

  const texts: string[] = []
  let totalChars = 0

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
    texts.push(`--- 第 ${i} 页 ---\n${pageText}`)
    totalChars += pageText.length
  }

  // 检测图片型 PDF：平均每页文本字符数低于阈值
  const avgCharsPerPage = totalChars / numPages
  const isImageBased = avgCharsPerPage < IMAGE_BASED_THRESHOLD

  let pageImages: File[] | undefined
  if (isImageBased) {
    // 图片型 PDF：渲染页面为图片
    pageImages = await renderPdfPages(file)
  }

  pdf.cleanup()

  return {
    text: texts.join('\n\n'),
    pageCount: numPages,
    isImageBased,
    pageImages,
  }
}

// ── DOCX 提取 ─────────────────────────────────────

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const extractFn = mammoth.extractRawText || (mammoth as any).default?.extractRawText
  if (!extractFn)
    throw new Error('mammoth 加载失败')
  const result = await extractFn({ arrayBuffer })
  return result.value
}

// ── 纯文本提取 ────────────────────────────────────

function extractPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

// ── 公共 API ──────────────────────────────────────

/** 获取文件扩展名（小写） */
function getExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase()
}

/** 判断文件是否为可提取文本的文档类型 */
export function isSupportedDocument(filename: string): boolean {
  return getExtension(filename) in DOC_EXTENSIONS
}

/** 获取支持的文件扩展名列表（用于 UI 提示） */
export function getSupportedExtensions(): string[] {
  return Object.keys(DOC_EXTENSIONS)
}

/** 获取 accept 属性值（用于 <input type="file">） */
export function getAcceptString(): string {
  return Object.keys(DOC_EXTENSIONS)
    .map(ext => `.${ext}`)
    .join(',')
}

/**
 * 从文件中提取文本内容
 *
 * 对 PDF 文件会额外检测是否为图片型（扫描件），
 * 若是则自动渲染页面为图片以供视觉模型分析。
 *
 * @returns ExtractionResult — 包含提取的文本、是否被截断、字符数、图片型标记
 * @throws Error — 不支持的文件类型或提取失败
 */
export async function extractDocumentText(file: File): Promise<ExtractionResult> {
  const ext = getExtension(file.name)
  const type = DOC_EXTENSIONS[ext]

  if (!type)
    throw new Error(`不支持的文件类型: .${ext}`)

  // PDF 特殊处理：提取文本 + 检测图片型 + 渲染页面
  if (type === 'pdf') {
    const { text: rawText, pageCount, isImageBased, pageImages } = await extractPdfWithMeta(file)

    let text = rawText.trim()
    const truncated = text.length > MAX_CHARS
    if (truncated)
      text = text.slice(0, MAX_CHARS)

    return {
      text,
      truncated,
      charCount: text.length,
      isImageBased,
      pageCount,
      pageImages,
    }
  }

  // DOCX / 纯文本
  let text: string
  switch (type) {
    case 'docx':
      text = await extractDocxText(file)
      break
    case 'text':
      text = await extractPlainText(file)
      break
    default:
      throw new Error(`不支持的文件类型: .${ext}`)
  }

  const trimmed = text.trim()
  const isTruncated = trimmed.length > MAX_CHARS

  return {
    text: isTruncated ? trimmed.slice(0, MAX_CHARS) : trimmed,
    truncated: isTruncated,
    charCount: isTruncated ? MAX_CHARS : trimmed.length,
    isImageBased: false,
    pageCount: 0,
  }
}

/**
 * 将提取的文档文本格式化为系统提示词上下文
 * 与 buildSearchContext 类似，注入到 pre_prompt 中
 */
export function buildDocumentContext(
  documents: { filename: string; text: string }[],
): string {
  if (!documents.length)
    return ''

  const sections = documents.map((doc, i) =>
    `═══ 文档 ${i + 1}: ${doc.filename} ═══\n${doc.text}`,
  ).join('\n\n')

  return `\n\n以下是用户上传的文档内容，请基于文档内容回答用户的问题：\n${sections}\n\n`
    + '回答要求：\n'
    + '- 优先基于文档内容回答\n'
    + '- 如果文档内容与问题无关，请说明\n'
    + '- 引用文档内容时标注"文档 1"、"文档 2"等来源'
}
