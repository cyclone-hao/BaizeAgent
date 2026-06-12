# AgentFlow 二次开发调研笔记

> 基于 Dify v1.9.0 源码分析，为后续重构提供技术依据。

---

## 1. 用户体系

### 两类用户

| | Account（控制台用户） | EndUser（终端用户） |
|---|---|---|
| 表 | `accounts` | `end_users` |
| 身份 | 工作空间成员 | AI应用使用者 |
| 认证 | 邮箱/SSO登录控制台 | JWT(WebApp) 或 API Key(Service API) |
| 角色 | owner/admin/editor/normal/dataset_operator | 无角色 |
| 入口 | `controllers/console/` | `controllers/web/` + `controllers/service_api/` |

### 关系模型
```
Account ←→ TenantAccountJoin(role, current) ←→ Tenant(工作空间)
```
- 一个Account可加入多个Tenant，每个Tenant中角色独立
- `Account.current_tenant` 通过 setter 加载 TenantAccountJoin.role
- `Account.set_tenant_id()` 切换工作空间

### 角色权限矩阵
| 能力 | owner | admin | editor | normal | dataset_operator |
|---|---|---|---|---|---|
| 订阅/付款 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 模型供应商配置 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 成员管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 创建/编辑应用 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 知识库管理 | ✅ | ✅ | ✅ | ❌ | ✅ |
| 查看配额/用量 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 关键代码位置
- `api/models/account.py` — Account, Tenant, TenantAccountJoin, TenantAccountRole
- `api/models/model.py` — EndUser (line 1472)
- `api/controllers/web/wraps.py` — EndUser JWT认证
- `api/controllers/service_api/wraps.py` — API Key认证

---

## 2. 模型价格/配额管理

### 价格记录机制
每条 Message 记录存储费用字段：
- `message_tokens`, `message_unit_price`, `message_price_unit`
- `answer_tokens`, `answer_unit_price`, `answer_price_unit`
- `total_price`, `currency`

### 配额扣减流程
```
消息创建 → message_was_created 信号
  → update_provider_when_message_created 事件处理器
    → 根据 QuotaUnit 计算消耗：
      - TOKENS: message_tokens + answer_tokens
      - CREDITS: 模型配置的 credit 值
      - TIMES: 每次调用 +1
    → 原子更新 Provider.quota_used (WHERE quota_limit > quota_used)
```

### 价格计算
`api/core/model_runtime/model_providers/__base/ai_model.py`:
```python
get_price(model, credentials, price_type, tokens) → PriceInfo
# 公式: total_amount = tokens × unit_price × unit
```

### 终端用户视角
- 完全不可见价格和配额信息
- 超额时只收到 `ProviderQuotaExceededError`
- web controllers 和 service_api controllers 中无任何价格相关接口

---

## 3. 系统配置架构

### DifyConfig 配置组（8个继承）
```
DifyConfig
├── PackagingInfo — 版本信息
├── DeploymentConfig — EDITION, DEBUG, DEPLOY_ENV
├── FeatureConfig — 30+子配置（最大）
│   ├── SecurityConfig (SECRET_KEY, token过期时间)
│   ├── AuthConfig (OAuth, 登录锁定期)
│   ├── LoginConfig (注册/登录方式开关)
│   ├── EndpointConfig (各服务URL)
│   ├── FileUploadConfig (上传限制)
│   ├── AppExecutionConfig (执行时间/并发/日限额)
│   ├── WorkflowConfig (步数/超时/并行深度)
│   ├── PluginConfig (Daemon URL, 包大小限制)
│   ├── MarketplaceConfig (市场开关/URL)
│   ├── CodeExecutionSandboxConfig
│   ├── MailConfig (SMTP/Resend/SendGrid)
│   ├── BillingConfig
│   ├── ModelLoadBalanceConfig
│   ├── PositionConfig (UI排序)
│   └── ... 更多
├── MiddlewareConfig — DB, Redis, Celery, 存储, 向量库(27种)
├── ExtraServiceConfig — Notion, Sentry
├── ObservabilityConfig — OpenTelemetry
├── RemoteSettingsSourceConfig — Apollo/Nacos
└── EnterpriseFeatureConfig — 企业版License
```

### 配置优先级（高→低）
1. 构造函数 → 2. 环境变量 → 3. 远程配置(Apollo/Nacos) → 4. .env文件 → 5. 文件密钥 → 6. pyproject.toml

### FeatureService 功能开关
- `get_features(tenant_id)` → 租户级特性（套餐配额、成员数、应用数等）
- `get_system_features()` → 系统级特性（登录方式、市场开关、企业品牌等）
- 前端通过 `useProviderContext()` 和 `useGlobalPublicStore()` 消费

### 关键门控环境变量
| 变量 | 值 | 影响 |
|---|---|---|
| `EDITION` | SELF_HOSTED / CLOUD | 安装向导、计费、Admin API |
| `ENTERPRISE_ENABLED` | false / true | 品牌替换、SSO、插件管理器 |
| `BILLING_ENABLED` | false / true | 配额执行、订阅 |
| `MARKETPLACE_ENABLED` | true / false | 插件市场 |
| `ALLOW_REGISTER` | false / true | 新用户注册 |
| `ALLOW_CREATE_WORKSPACE` | false / true | 创建工作空间 |

---

## 4. 插件系统

### 架构
```
Dify API(:5001) ←→ Plugin Daemon(:5002) ←→ Plugin Runtimes(沙箱进程)
     ↕
Marketplace(marketplace.dify.ai) — 插件分发
```

### 插件类型
| 类型 | 枚举值 | 说明 |
|---|---|---|
| Model | `model` | 模型供应商（OpenAI、Anthropic等） |
| Tool | `tool` | 工具（SerpAPI、Google Search等） |
| Extension | `extension` | 通用扩展 |
| AgentStrategy | `agent-strategy` | Agent策略（ReAct、function calling等） |
| Datasource | `datasource` | 数据源 |

### 安装来源
| 来源 | 说明 | 可控性 |
|---|---|---|
| Marketplace | marketplace.dify.ai 下载 | ❌ 外部服务 |
| GitHub | GitHub Release 下载 | ⚠️ 需要网络 |
| Package | 本地 .afpkg 上传 | ✅ 完全可控 |
| Remote | 远程调试 | ✅ 开发用 |

### 关键配置
```python
PLUGIN_DAEMON_URL = "http://localhost:5002"
PLUGIN_DAEMON_KEY = "plugin-api-key"
MARKETPLACE_ENABLED = True  # 可关闭
MARKETPLACE_API_URL = "https://marketplace.dify.ai"
```

### 权限系统
```python
TenantPluginPermission:
  install_permission: EVERYONE / ADMINS / NOBODY
  debug_permission: EVERYONE / ADMINS / NOBODY
```

### Backwards Invocation（插件回调Dify）
插件通过 Inner API 回调 Dify：
- `POST /inner/api/invoke/llm` — 调用LLM
- `POST /inner/api/invoke/text-embedding` — 文本嵌入
- `POST /inner/api/invoke/tool` — 调用工具
- `POST /inner/api/invoke/app` — 调用应用
- 认证方式：`X-Inner-Api-Key` header

### 前端插件页面
- `web/app/components/plugins/plugin-page/` — 插件管理主页
- `web/app/components/plugins/marketplace/` — 市场浏览
- `web/app/components/plugins/install-plugin/` — 安装流程（Marketplace/GitHub/本地）

### 重构建议
1. 关闭 Marketplace（`MARKETPLACE_ENABLED=false`）
2. 前端隐藏 Marketplace 标签，改名为"AgentFlow 插件中心"
3. 所有插件通过 .afpkg 本地安装或 GitHub 安装
4. 中期：搭建私有插件仓库，实现兼容 API：
   - `GET /api/v1/plugins/download?unique_identifier=...`
   - `POST /api/v1/plugins/batch`
   - `POST /api/v1/stats/plugins/install_count`

---

## 5. 探索应用（应用市场）

### 三种数据源模式
```python
HOSTED_FETCH_APP_TEMPLATES_MODE: "remote" | "db" | "builtin"
```

| 模式 | 数据源 | 适合二次开发 |
|---|---|---|
| remote | tmpl.dify.ai（Dify官方） | ❌ 暴露Dify来源 |
| db | recommended_apps 数据库表 | ✅ **推荐** |
| builtin | recommended_apps.json 硬编码 | ⚠️ 不够灵活 |

### db模式部署步骤
1. 设置环境变量：`HOSTED_FETCH_APP_TEMPLATES_MODE=db`
2. 创建应用，设置 `app.is_public = True`
3. 插入 `recommended_apps` 表：
   ```sql
   INSERT INTO recommended_apps (id, app_id, description, category, position, is_listed, language)
   VALUES (uuid, '<app_id>', '{"zh-Hans": "描述"}', '政务服务', 1, true, 'zh-Hans');
   ```
4. 修改前端分类 i18n（`web/i18n/zh-Hans/explore.ts`）

### 安装流程
```
用户点击"添加到工作空间"
  → fetchAppDetail(id) 获取 export_data (YAML DSL)
  → POST /apps/import 创建应用副本
  → 重定向到新应用
```
本质是 DSL 克隆，用户得到完全独立的新应用。

### 分类系统
- i18n 定义显示名称：`web/i18n/en-US/explore.ts` → category 对象
- db模式下分类从 RecommendedApp.category 动态收集
- 可自定义为任何业务分类（如"政务服务"、"内容创作"等）

### 关键代码位置
- `api/services/recommended_app/` — 三种模式的 Factory
- `api/controllers/console/explore/` — 探索API
- `api/models/model.py` — RecommendedApp, InstalledApp
- `web/app/components/explore/` — 前端组件
- `web/app/(commonLayout)/explore/apps/page.tsx` — 探索页面路由

### 重构建议
1. 切换到 db 模式
2. 创建广电专属模板应用（政务问答、文件起草、数据分析等）
3. 重新定义分类体系
4. 前端 Category 组件和 i18n 替换为中文业务术语
5. 移除远程 tmpl.dify.ai 依赖

---

## 6. 已知二次开发遗留问题

| 问题 | 位置 | 影响 |
|---|---|---|
| 嵌入聊天域名检测 | `embedded-chatbot/utils.ts` | `isAgentFlow()` 检查 `agentflow.ai`，部署在其他域名时图标不对 |
| Marketplace URL | `.env.local` | 仍指向 marketplace.dify.ai |
| 首页AI助手 | `.env.local` | `NEXT_PUBLIC_HOME_CHAT_APP_ID` 为空 |
| 文档链接 | 多个文件 | docs.dify.ai 替换为 `#`，无法打开 |
| i18n引号 | i18n 文件 | 新增 i18n key 时须用直引号，不用弯引号 |

---

## 7. 重构路线

### Phase 1（立即可做）
- [ ] 探索应用：切换 db 模式 + 创建广电专属模板
- [ ] 分类重构：改为广电业务分类（政务服务/内容创作/数据分析等）
- [ ] 关闭 Marketplace 入口，改为"插件管理"
- [ ] 继续清理 Dify 残留标识

### Phase 2（1-2个月）
- [ ] 重做插件管理页面（隐藏安装来源选项）
- [ ] 自建插件仓库服务
- [ ] 打包常用插件为 .afbndl 预装
- [ ] 工作流模板/节点描述全面中文化

### Phase 3（长期）
- [ ] Fork Plugin Daemon（如开源）
- [ ] 自建完整插件生态
- [ ] 添加广电特色功能模块（审批流、权限控制等）
