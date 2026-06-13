import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import RemarkMath from 'remark-math'
import RemarkBreaks from 'remark-breaks'
import RehypeKatex from 'rehype-katex'
import RemarkGfm from 'remark-gfm'
import RehypeRaw from 'rehype-raw'
import { flow } from 'lodash-es'
import cn from '@/utils/classnames'
import { customUrlTransform, preprocessCitations, preprocessLaTeX, preprocessThinkTag } from './markdown-utils'
import {
  AudioBlock,
  CodeBlock,
  Img,
  Link,
  MarkdownButton,
  MarkdownForm,
  Paragraph,
  ScriptBlock,
  ThinkBlock,
  VideoBlock,
} from '@/app/components/base/markdown-blocks'

/**
 * @fileoverview Main Markdown rendering component.
 * This file was refactored to extract individual block renderers and utility functions
 * into separate modules for better organization and maintainability as of [Date of refactor].
 * Further refactoring candidates (custom block components not fitting general categories)
 * are noted in their respective files if applicable.
 */
export type MarkdownProps = {
  content: string
  className?: string
  customDisallowedElements?: string[]
  customComponents?: Record<string, React.ComponentType<any>>
}

export const Markdown = (props: MarkdownProps) => {
  const { customComponents = {} } = props
  const latexContent = flow([
    preprocessThinkTag,
    preprocessCitations,
    preprocessLaTeX,
  ])(props.content)

  return (
    <div className={cn('markdown-body', '!text-text-primary', props.className)}>
      <ReactMarkdown
        remarkPlugins={[
          RemarkGfm,
          [RemarkMath, { singleDollarTextMath: false }],
          RemarkBreaks,
        ]}
        rehypePlugins={[
          RehypeKatex,
          RehypeRaw as any,
          // The Rehype plug-in is used to remove the ref attribute of an element
          () => {
            return (tree: any) => {
              const iterate = (node: any) => {
                if (node.type === 'element' && node.properties?.ref)
                  delete node.properties.ref

                if (node.type === 'element' && !/^[a-z][a-z0-9]*$/i.test(node.tagName)) {
                  node.type = 'text'
                  node.value = `<${node.tagName}`
                }

                if (node.children)
                  node.children.forEach(iterate)
              }
              tree.children.forEach(iterate)
            }
          },
        ]}
        urlTransform={customUrlTransform}
        disallowedElements={['iframe', 'head', 'html', 'meta', 'link', 'style', 'body', ...(props.customDisallowedElements || [])]}
        components={{
          code: CodeBlock,
          img: Img,
          video: VideoBlock,
          audio: AudioBlock,
          a: ({ node, children, ...aProps }: any) => {
            // Citation reference: render as clickable badge
            if (aProps.className === 'citation-ref') {
              return (
                <a
                  href={aProps.href}
                  className="citation-ref"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    const targetId = aProps.href?.toString().substring(1)
                    if (targetId) {
                      const el = document.getElementById(targetId)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  style={{
                    fontSize: '0.75em',
                    fontWeight: 600,
                    padding: '0 4px',
                    borderRadius: '4px',
                    backgroundColor: 'rgb(238 242 255)',
                    color: 'rgb(79 70 229)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    verticalAlign: 'super',
                    lineHeight: 1,
                  }}
                >
                  {children}
                </a>
              )
            }
            // Regular link: use default Link component
            return <Link node={node} {...aProps}>{children}</Link>
          },
          p: Paragraph,
          button: MarkdownButton,
          form: MarkdownForm,
          script: ScriptBlock as any,
          details: ThinkBlock,
          ...customComponents,
        }}
      >
        {/* Markdown detect has problem. */}
        {latexContent}
      </ReactMarkdown>
    </div>
  )
}
