# 白泽智能体平台 UI 二次开发定制记录

## 品牌名称
- **新品牌名**: 白泽智能体平台
- **主色调**: 紫色系 (#8b5cf6)

---

## 已完成的修改

### 1. 全局主色调 ✅
**文件**: `web/tailwind-common-config.ts`
- 将 primary 颜色从蓝色系 (#2970ff) 改为紫色系 (#8b5cf6)
- 影响所有使用 `primary-*` 的组件（按钮、链接、高亮等）

### 2. Logo 替换 ✅
**文件**:
- `web/public/logo/logo.svg` - 主 Logo（紫色+黑色文字）
- `web/public/logo/logo-monochrome-white.svg` - 深色模式 Logo（白色）
- `web/public/favicon.svg` - 新增 SVG Favicon（紫色圆角方块 + A）

**效果**: 
- 登录页左上角 Logo
- 顶部导航栏 Logo
- 关于对话框 Logo

### 3. Logo 组件更新 ✅
**文件**: `web/app/components/base/logo/dify-logo.tsx`
- 更新 alt 文本为 "白泽智能体平台 logo"

### 4. 页面元数据 ✅
**文件**: `web/app/layout.tsx`
- `apple-mobile-web-app-title`: "Dify" → "白泽智能体平台"

### 5. 国际化文案 ✅
**文件**:
- `web/i18n/zh-Hans/common.ts` - 中文文案
- `web/i18n/en-US/common.ts` - 英文文案

**修改内容**: 所有 "Dify" 替换为 "白泽智能体平台"
- 邀请提示
- 版本更新提示
- API 扩展说明
- 等

### 6. 登录页版权信息 ✅
**文件**: `web/app/signin/layout.tsx`
- 底部版权: "LangGenius, Inc." → "白泽智能体平台"

---

## 待处理项（建议后续修改）

### 1. Favicon 图标
当前 favicon.ico 仍是 Dify 的图标，需要：
- 使用在线工具（如 favicon.io）生成新的 favicon.ico
- 替换 `web/public/favicon.ico`
- 同时替换各尺寸的 icon-*.png 文件

### 2. 其他语言 i18n
目前只更新了中文和英文，其他语言文件也有 "Dify" 引用：
- `web/i18n/de-DE/` (德语)
- `web/i18n/ja-JP/` (日语)
- `web/i18n/ko-KR/` (韩语)
- 等

### 3. About 对话框
**文件**: `web/app/components/header/account-about/index.tsx`
- 版权信息: "© LangGenius, Inc., Contributors"
- GitHub 链接指向 langgenius/dify
- 隐私政策/服务条款链接指向 dify.ai

### 4. 工作流画布节点样式
如需深度定制工作流编辑器外观：
- `web/app/components/workflow/nodes/` - 各节点类型样式
- `web/app/components/workflow/canvas/` - 画布组件

### 5. 按钮/表单基础组件
如需修改按钮圆角、阴影等：
- `web/app/components/base/button/` - 按钮组件
- `web/app/components/base/input/` - 输入框组件

### 6. 侧边栏导航
- `web/app/components/app-sidebar/` - 应用侧边栏
- `web/app/components/header/nav/` - 顶部导航项

---

## 开发环境

### 启动命令
```bash
cd /d/MyNewStart/CC实战/agentflow/web
pnpm dev
```

### 访问地址
- 前端: http://localhost:3000
- 调试器: ws://127.0.0.1:9229

### 环境变量
配置文件: `web/.env.local`
- `NEXT_PUBLIC_API_PREFIX`: 后端 API 地址
- `NEXT_PUBLIC_PUBLIC_API_PREFIX`: Web App API 地址

---

## 技术栈

- **框架**: Next.js 15.5.0 (App Router)
- **UI**: React 18 + TypeScript
- **样式**: TailwindCSS 3.4
- **状态管理**: Zustand + React Context
- **工作流**: React Flow

---

## 修改检查清单

- [x] 主色调改为紫色
- [x] Logo SVG 替换
- [x] 白色 Logo SVG 替换
- [x] Logo 组件 alt 文本
- [x] 页面标题元数据
- [x] 中英文 i18n 文案
- [x] 登录页版权信息
- [x] 新增 SVG Favicon
- [ ] favicon.ico 替换
- [ ] icon-*.png 图标替换
- [ ] 其他语言 i18n 更新
- [ ] About 对话框版权信息
- [ ] 工作流节点样式定制
- [ ] 按钮/表单样式定制

---

## 颜色参考

### 新的主色调 (Purple)
```
primary-25:  #faf5ff
primary-50:  #f3e8ff
primary-100: #e9d5ff
primary-200: #d8b4fe
primary-300: #c084fc
primary-400: #a855f7
primary-500: #8b5cf6  ← 主色
primary-600: #7c3aed
primary-700: #6d28d9
primary-800: #5b21b6
primary-900: #4c1d95
```

---

## 版本信息

- **Dify 版本**: 1.9.0
- **修改日期**: 2026/06/07
- **Git 分支**: (detached HEAD at 1.9.0)
- **Node.js**: v24.15.0
- **pnpm**: 10.33.4

---

## 后端部署进度（2026/06/07 记录）

### 当前状态

| 项目 | 状态 |
|------|------|
| ✅ 前端开发服务器 | 运行中 http://localhost:3000（`pnpm dev`）|
| ✅ UI 定制代码 | 已完成（Logo、主色调、品牌名） |
| ✅ Docker Desktop | 已安装 (v29.5.2, Docker Compose v5.1.4) |
| ✅ 前端依赖 | 已安装（`pnpm install` 完成） |
| ✅ 环境变量 | `.env.local` 已从 `.env.example` 复制 |
| ✅ 中间件配置 | `middleware.env` 已从 `middleware.env.example` 复制 |
| ❌ WSL2 | **未安装（阻塞项，需要管理员权限）** |
| ❌ 后端服务 | 未启动（依赖 WSL2 + Docker） |
| ❌ PostgreSQL / Redis | 未启动（在 Docker 中运行） |
| ❌ Dify API Server | 未启动 |
| ❌ Dify Worker (Celery) | 未启动 |

### 启动后端的前置条件

1. **以管理员身份打开 PowerShell，运行 `wsl --install`**
2. **重启电脑**
3. **打开 Docker Desktop，等待右下角鲸鱼图标变绿（约 1-2 分钟）**

### 后端启动步骤（WSL2 就绪后）

```bash
# 1. 启动中间件（PostgreSQL + Redis + 向量数据库 + Sandbox）
cd /d/MyNewStart/CC实战/agentflow/docker
docker compose -f docker-compose.middleware.yaml up -d

# 2. 安装 Python 3.11 或 3.12（当前 Python 3.14 不兼容 Dify API）
#    推荐用 pyenv-win 或从 https://www.python.org/downloads/ 下载

# 3. 配置后端环境
cd /d/MyNewStart/CC实战/agentflow/api
cp .env.example .env
# 编辑 .env 文件，确保数据库、Redis 等连接配置正确

# 4. 安装 Python 依赖
pip install -e .

# 5. 运行数据库迁移
flask db upgrade

# 6. 启动 API Server（新终端）
flask run --port 5001

# 7. 启动 Worker（新终端）
celery -A app.celery worker -P gevent -c 1 --loglevel INFO
```

### 环境注意事项

- **Python 版本**: Dify API 要求 `>=3.11, <3.13`，当前系统是 3.14.5 **不兼容**
- **WSL2 必须安装**: Docker Desktop 在 Windows 上依赖 WSL2 后端
- **前端 API 地址**: `.env.local` 中 `NEXT_PUBLIC_API_PREFIX=http://localhost:5001/console/api`

### 前端单独预览（不需要后端）

前端开发服务器已运行，以下页面可直接访问：
- 登录页: http://localhost:3000/signin（可看到新 Logo + 紫色主色调）
- 应用列表: http://localhost:3000/apps（会提示后端连接错误，但能看到外壳 UI）
- 安装页: http://localhost:3000/install（依赖后端 API，会报 ERR_CONNECTION_REFUSED）

---

## 历史讨论记录

### 1. Dify 功能模块梳理
- 完整的功能模块地图（Agent、工作流、RAG、模型管理等）
- 源代码目录结构映射（`api/core/workflow/`, `web/app/components/`）

### 2. 二次开发策略（20人内部使用）
- 保留模块：工作流引擎、Agent、Prompt IDE、RAG 管线
- 裁剪模块：多租户、计费、过多模型供应商
- 扩展模式：插件 + 外挂式（不改核心代码）

### 3. SaaS 商业化策略
- **Dify 协议**：修改版 Apache 2.0，禁止去 Logo、禁止未授权多租户 SaaS
- **合规风险**：已有企业收到律师函，Dify 2026年完成 $30M 融资后维权力度加大
- **推荐路径**：
  - 内部使用：保留 Logo，做 UI 定制时不删 Dify 品牌
  - 对外 SaaS：联系 business@dify.ai 获取企业授权
  - 技术准备：用"隔离层架构"让 Dify 只做后端引擎，用户不直接接触 Dify 界面

### 4. 源码完整性确认
- 前端代码 100% 开源，位于 `web/` 目录
- 技术栈：Next.js 14 + React 18 + TypeScript + TailwindCSS
- 代码量：~1.24 万行前端 + 大量后端代码
- 社区二开参考：Dify-Plus、Dify-Web 等项目

---

## 关键文件路径速查

```
/d/MyNewStart/CC实战/agentflow/
├── web/                                    # 前端（已定制）
│   ├── tailwind-common-config.ts           # ⭐ 主色调配置（已改紫色）
│   ├── public/logo/                        # ⭐ Logo 文件（已替换）
│   ├── app/components/base/logo/           # ⭐ Logo 组件（已改）
│   ├── app/layout.tsx                      # ⭐ 全局布局 + meta（已改）
│   ├── app/signin/layout.tsx               # ⭐ 登录页布局（已改）
│   ├── i18n/zh-Hans/common.ts              # ⭐ 中文文案（已改）
│   ├── i18n/en-US/common.ts                # ⭐ 英文文案（已改）
│   ├── .env.local                          # 前端环境变量
│   └── UI-CUSTOMIZATION.md                 # 本文件
├── api/                                    # 后端（待配置）
│   ├── .env.example                        # 后端环境变量模板
│   ├── app.py                              # Flask 入口
│   └── core/workflow/                      # 工作流引擎
├── docker/                                 # Docker 部署
│   ├── docker-compose.yaml                 # 完整部署
│   ├── docker-compose.middleware.yaml      # 仅中间件
│   └── middleware.env                      # 中间件环境变量（已配置）
└── /d/MyNewStart/DockerDesktopInstaller.exe  # Docker 安装包（已安装）
```
