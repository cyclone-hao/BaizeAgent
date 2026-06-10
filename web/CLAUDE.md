# Dify Web Frontend — 项目架构文档

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 15.5.0 |
| UI 库 | React | 19.1.1 |
| 语言 | TypeScript | 5.8.3 |
| 样式 | Tailwind CSS | 3.4 |
| 包管理 | pnpm | 10.16.0 |
| 服务端状态 | SWR + TanStack React Query v5 | |
| 客户端状态 | Zustand | |
| 表单 | react-hook-form + Zod | |
| 图标 | @remixicon/react | 4.5.0 |
| 无头组件 | @headlessui/react | 2.2.1 |
| 工作流画布 | reactflow | |
| 图表 | echarts + mermaid | |
| Node 要求 | >= v22.11.0 | |

**注意**: 本项目没有使用 Ant Design / Element UI / Shadcn 等第三方 UI 库。所有 UI 组件均为自建，位于 `app/components/base/`（70+ 组件）。

## 目录结构

```
web/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局（ThemeProvider, i18n, Sentry, TanStack）
│   ├── page.tsx                  # "/" → 重定向到 /home
│   │
│   ├── (commonLayout)/           # 路由组：认证后的页面，带 GlobalSidebar
│   │   ├── layout.tsx            # 包裹 GlobalSidebar + 上下文 Provider
│   │   ├── home/page.tsx         # /home — 首页（默认落地页）
│   │   ├── apps/page.tsx         # /apps — 应用列表（工作室）
│   │   ├── app/(appDetailLayout)/# 应用详情页
│   │   │   └── [appId]/
│   │   │       ├── overview/     # 概览
│   │   │       ├── workflow/     # 工作流编辑器
│   │   │       ├── configuration/# 配置
│   │   │       ├── logs/         # 日志
│   │   │       ├── develop/      # 开发
│   │   │       └── annotations/  # 标注
│   │   ├── datasets/             # 知识库页面
│   │   ├── explore/apps/         # Skills 市场
│   │   ├── tools/                # 工具管理
│   │   └── plugins/              # 插件管理
│   │
│   ├── (shareLayout)/            # 公开分享页面（无侧边栏）
│   ├── signin/                   # 登录
│   ├── signup/                   # 注册
│   ├── install/                  # 安装向导
│   └── account/                  # 账户设置
│
├── components/                   # 所有 UI 组件
│   ├── base/                     # 70+ 基础组件（Button, Modal, Input, Select, etc.）
│   ├── global-sidebar/           # 主导航侧边栏
│   ├── header/                   # 顶部导航栏
│   ├── home/                     # 首页组件
│   ├── apps/                     # 应用列表页组件
│   ├── explore/                  # Skills 市场组件
│   ├── workflow/                 # 工作流编辑器
│   └── ...                       # 其他功能模块组件
│
├── context/                      # React Context（AppContext, ProviderContext, etc.）
├── hooks/                        # 自定义 Hooks
├── i18n/ & i18n-config/          # 国际化（i18next）
├── models/                       # TypeScript 数据模型
├── service/                      # API 服务层
├── types/                        # 类型定义
├── utils/                        # 工具函数
├── themes/                       # 主题配置
└── public/                       # 静态资源
```

## 路由架构

### 路由组设计

- `(commonLayout)`: 需要认证的页面，包裹 `GlobalSidebar` + 完整 Provider 链
- `(shareLayout)`: 公开分享页面，无侧边栏
- 认证页面（signin, signup 等）: 独立布局

### 默认落地页

- `/` → 重定向到 `/home`（配置在 `next.config.js` redirects）
- 登录后默认跳转到 `/home`（7 个 signin/signup/install 文件）
- 根页面 `app/page.tsx` 的 fallback Link 也指向 `/home`

### 全局侧边栏导航项

| 顺序 | 名称 | 路由 | activeSegment | 图标 |
|------|------|------|---------------|------|
| 1 | 首页 | /home | "home" | RiHome4Line/Fill |
| 2 | Skills市场 | /explore/apps | "explore" | RiPlanetLine/Fill |
| 3 | 工作室 | /apps | ["apps", "app"] | RiRobot2Line/Fill |
| 4 | 知识库 | /datasets | "datasets" | RiBook2Line/Fill |
| 5 | 工具 | /tools | "tools" | RiHammerLine/Fill |
| 6 | 插件 | /plugins | "plugins" | Group (自定义) |

## 核心模式与约定

### 1. 页面组件模式

```tsx
// 路由文件（薄壳）— app/(commonLayout)/xxx/page.tsx
import XxxPage from '@/app/components/xxx'
export default function Page() {
  return <XxxPage />
}

// 实际组件 — app/components/xxx/index.tsx
'use client'
const XxxPage = () => {
  // 使用 hooks、context、数据获取
  return <div>...</div>
}
export default XxxPage
```

### 2. 侧边栏 NavItem 模式

```tsx
<SidebarNavItem
  expand={expand}                      // boolean: 展开/收起状态
  icon={<RiXxxLine className="h-5 w-5" />}    // 默认图标
  activeIcon={<RiXxxFill className="h-5 w-5" />} // 激活图标
  text="名称"                          // 显示文本
  href="/route"                        // 路由地址
  activeSegment="segment"              // 匹配 useSelectedLayoutSegment()
/>
```

- 侧边栏宽度：收起 60px，展开 216px，状态持久化到 localStorage key `global-sidebar-expand`
- 激活状态通过 `useSelectedLayoutSegment()` 判断
- 收起时自动包裹 `<Tooltip>` 显示文字

### 3. 数据获取模式

#### SWR Fetcher（主要方式）
```tsx
// service/xxx.ts
export const fetchXxx: Fetcher<ResponseType, { url: string; params?: any }> = ({ url, params }) => {
  return get<ResponseType>(url, { params })
}

// 组件中使用
const { data, isLoading } = useSWR(
  { url: 'apps', params: { page: 1, limit: 30 } },
  fetchAppList
)
```

#### SWR Infinite（分页列表）
```tsx
const { data, setSize } = useSWRInfinite(
  (pageIndex, previousPageData) => getKey(pageIndex, previousPageData, ...filters),
  fetchAppList,
  { revalidateFirstPage: true }
)
// IntersectionObserver 监听底部元素触发 setSize(n+1)
```

#### TanStack React Query（部分新功能）
```tsx
// service/use-xxx.ts
export const useGetXxx = () => {
  return useQuery({ queryKey: ['xxx'], queryFn: fetchXxx })
}
```

### 4. 用户上下文

```tsx
import { useAppContext } from '@/context/app-context'

const {
  userProfile,              // { id, name, email, avatar, avatar_url }
  currentWorkspace,         // { id, name, plan, status, role }
  isCurrentWorkspaceEditor, // owner | admin | editor
  isCurrentWorkspaceOwner,  // owner
  isCurrentWorkspaceDatasetOperator, // dataset_operator
  isCurrentWorkspaceManager, // owner | admin
  mutateUserProfile,        // 刷新用户数据
  mutateCurrentWorkspace,   // 刷新工作区数据
} = useAppContext()
```

### 5. URL 同步的筛选状态

```tsx
import { useTabSearchParams } from '@/hooks/use-tab-searchparams'
const [currTab, setCurrTab] = useTabSearchParams({
  defaultTab: 'all',
  disableSearchParams: false,
})
```

### 6. 应用导航跳转

```tsx
import { getRedirection } from '@/utils/app-redirection'
// 根据用户角色和应用类型跳转到正确页面
getRedirection(isCurrentWorkspaceEditor, app, (href) => router.push(href))
// editor → /app/{id}/workflow 或 /app/{id}/configuration
// viewer → /app/{id}/overview
```

### 7. 防抖搜索

```tsx
import { useDebounceFn } from 'ahooks'
const { run: handleSearch } = useDebounceFn(() => {
  setSearchKeywords(keywords)
}, { wait: 500 })
```

## API 端点一览

### 应用管理
| 端点 | 方法 | 说明 |
|------|------|------|
| `/console/api/apps` | GET | 应用列表（分页, 支持 mode/name/tag_ids 筛选） |
| `/console/api/apps/{id}` | GET | 应用详情 |
| `/explore/apps` | GET | 探索市场应用列表 { categories, recommended_apps } |
| `/installed-apps` | GET | 已安装应用列表 |

### 知识库
| 端点 | 方法 | 说明 |
|------|------|------|
| `/datasets` | GET | 知识库列表 |

### 用户与工作区
| 端点 | 方法 | 说明 |
|------|------|------|
| `/account/profile` | GET | 当前用户信息 |
| `/workspaces/current` | GET | 当前工作区信息 |
| `/workspaces/current/members` | GET | 工作区成员列表 |

## 样式约定

### Tailwind 设计 Token

项目使用语义化 CSS 变量（非传统 Tailwind 颜色）：

```
text-text-primary          # 主文字
text-text-secondary        # 次文字
text-text-tertiary         # 辅助文字
text-text-quaternary       # 最弱文字

bg-background-body         # 页面背景
bg-background-default-subtle # 侧边栏背景
bg-components-card-bg      # 卡片背景
bg-components-input-bg-normal # 输入框背景
bg-state-base-hover        # 悬停状态

border-divider-regular     # 分割线
border-divider-subtle      # 弱分割线
border-components-card-border # 卡片边框
```

### 响应式断点

```
sm: 640px    # 小屏
md: 768px    # 平板
lg: 1024px   # 小桌面
xl: 1280px   # 桌面
2xl: 1536px  # 大桌面
2k: 1920px+  # 超大屏（部分组件自定义）
```

### 卡片网格布局（常用模式）
```
grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4
```

### 隐藏滚动条
使用全局 CSS 类 `no-scrollbar`（定义在 `app/styles/globals.css`）

## 自定义基础组件速查

| 组件 | 路径 | 关键 Props |
|------|------|-----------|
| Input | `base/input` | showLeftIcon, showClearIcon, size, destructive |
| Button | `base/button` | variant ('primary'/'secondary'/...) |
| Loading | `base/loading` | type ('area'/'app') |
| AppIcon | `base/app-icon` | size, iconType, icon, background, imageUrl |
| Modal | `base/modal` | show, onClose, title |
| Tooltip | `base/tooltip` | popupContent, position |
| Select | `base/select` | items, value, onSelect |
| Switch | `base/switch` | checked, onChange |
| Tabs | `base/tabs` | (无通用组件，各模块自建) |
| Dialog | `base/dialog` | show, onConfirm, onCancel |

## 国际化

- 使用 `react-i18next`
- 源语言：英语 (`i18n/en-US/`)
- 翻译文件按模块分：`common.ts`, `app.ts`, `explore.ts`, `dataset.ts`, `workflow.ts` 等
- 组件中使用 `const { t } = useTranslation()` + `t('key')`
- 部分中文硬编码（如首页问候语）

## 主题

- 使用 `next-themes`
- 支持 light / dark / system 三种模式
- CSS 变量自动适配主题（`text-text-*`, `bg-background-*` 等）
- 组件无需额外处理暗色模式

## 首页架构（/home）

### 组件结构
```
app/(commonLayout)/home/page.tsx          # 路由入口
└── app/components/home/index.tsx         # 主容器（搜索状态管理）
    ├── greeting-section.tsx              # 问候 + 搜索框 + 推荐标签
    ├── recently-used.tsx                 # 最近使用（横向滚动卡片）
    └── agent-plaza.tsx                   # 智能体广场（分类Tab + 卡片网格）
```

### 数据流
- 用户名：`useAppContext().userProfile.name`
- 最近使用：`useSWR({ url: 'apps', params: { page: 1, limit: 8 } }, fetchAppList)` — 控制台 API
- 智能体广场：`useSWR(['/explore/apps'], () => fetchAppList())` — 探索 API
- 搜索联动：首页搜索框 → searchKeywords → AgentPlaza 过滤

### 重定向链路
以下位置均指向 `/home` 作为默认落地页：
- `next.config.js` redirects
- `app/page.tsx` fallback
- 7 个认证文件（signin/signup/install）
- `app/components/header/index.tsx` logo 链接
- `app/account/(commonLayout)/header.tsx` 返回按钮

## 开发命令

```bash
cd dify/web
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器
pnpm build            # 生产构建
pnpm lint             # ESLint 检查
pnpm eslint-fix       # 自动修复 ESLint 问题
pnpm test             # Jest 测试
```

## 常见修改清单

### 添加新页面
1. 在 `app/(commonLayout)/xxx/page.tsx` 创建路由文件
2. 在 `app/components/xxx/index.tsx` 创建组件
3. 如需侧边栏导航，在 `global-sidebar/index.tsx` 添加 NavItem

### 添加新 API 调用
1. 在 `service/xxx.ts` 定义 Fetcher 函数
2. 在组件中使用 `useSWR` 或 `useQuery` 调用
3. 数据类型定义在 `models/xxx.ts` 或 `types/xxx.ts`

### 修改默认落地页
需同步修改：`next.config.js` + `app/page.tsx` + 7个认证文件 + 2个 header 文件
