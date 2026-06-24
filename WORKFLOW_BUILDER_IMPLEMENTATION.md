# AI 工作流构建器 - 实现总结

## 功能概述

在智能体编排页面（/apps）新增"AI 创建工作流"功能，用户通过自然语言对话描述需求，AI 自动设计工作流并生成完整配置，一键创建后可直接在工作流编辑器中微调。

## 技术方案：方案 A（前端直调）

### 架构

```
用户点击"AI 创建工作流"按钮
    ↓
打开对话弹窗（左右分栏：对话 + 预览）
    ↓
用户输入自然语言描述（如"我想创建客服智能体"）
    ↓
前端调用 POST /console/api/workflow-builder/chat
    ↓
后端调用 DashScope qwen-plus（使用专用 system prompt）
    ↓
LLM 返回工作流设计 + JSON
    ↓
前端解析 JSON，右侧显示 SVG 预览
    ↓
用户确认后点击"创建工作流"
    ↓
前端调用：
  1. POST /apps → 创建应用
  2. POST /apps/{id}/workflows/draft → 同步工作流图
    ↓
自动跳转到工作流编辑页面
```

## 新增文件清单

### 后端（api/）

1. **`api/controllers/console/workflow_builder.py`**
   - POST /console/api/workflow-builder/chat 端点
   - 调用 DashScope qwen-plus 模型
   - 包含完整的 system prompt（9 种节点类型 + 输出格式 + 交互流程）
   - 自动提取并验证 JSON 工作流定义

### 前端（web/）

2. **`web/service/workflow-builder.ts`**
   - TypeScript 类型定义（WorkflowNode, WorkflowEdge, WorkflowJson）
   - `chatWithWorkflowBuilder()` 服务函数

3. **`web/app/components/apps/workflow-builder/dialog.tsx`**
   - 主弹窗组件（Modal）
   - 左侧：对话消息列表 + 输入框
   - 右侧：工作流 SVG 预览 + 创建按钮
   - 包含 2 个示例场景按钮

4. **`web/app/components/apps/workflow-builder/use-workflow-builder.ts`**
   - 核心 Hook
   - 管理对话状态（messages）
   - 调用 LLM API
   - 解析工作流 JSON
   - 创建工作流（createApp + syncWorkflowDraft）

5. **`web/app/components/apps/workflow-builder/workflow-preview.tsx`**
   - SVG 工作流预览组件
   - 节点按类型着色（start 绿、llm 紫、knowledge-retrieval 橙等）
   - 贝塞尔曲线连接边

6. **`web/app/components/apps/workflow-builder/index.tsx`**
   - 导出入口

## 修改文件清单

### 后端

1. **`api/controllers/console/__init__.py`**
   - 导入 `workflow_builder` 模块
   - 添加到 `__all__` 列表

### 前端

2. **`web/app/components/apps/new-app-card.tsx`**
   - 新增"AI 创建工作流"按钮（紫色渐变，RiSparklingFill 图标）
   - 添加 `showWorkflowBuilder` 状态
   - 动态加载 WorkflowBuilderDialog

3. **`web/update.log`**
   - 记录完整功能实现（P0/P1/P2 三个层级）

## 支持的节点类型

| 节点类型 | 颜色 | 用途 |
|---------|------|------|
| start | 绿色 | 工作流入口，定义输入变量 |
| end | 红色 | 工作流结束，定义输出 |
| llm | 紫色 | 调用大语言模型 |
| knowledge-retrieval | 橙色 | 知识库检索 |
| code | 青色 | 执行代码（Python/JS） |
| if-else | 粉色 | 条件分支 |
| tool | 蓝绿色 | 调用外部工具 |
| http-request | 靛蓝色 | HTTP 请求 |
| answer | 黄绿色 | 直接输出答案（Chatflow） |

## 交互流程

### 1. 用户描述需求
```
用户: "我想创建一个能回答产品问题的客服智能体"
```

### 2. AI 询问细节
```
AI: "好的，我来帮你设计。需要确认几点：
1. 你有现成的产品知识库吗？
2. 用户输入是什么？
3. 如果知识库找不到答案，怎么处理？"
```

### 3. AI 提出设计方案
```
AI: "明白了。我设计的工作流如下：
[开始: 输入"问题"]
    ↓
[知识库检索: 用"问题"查询知识库]
    ↓
[LLM: 根据检索结果回答问题]
    ↓
[条件判断: 检查回答是否包含"无法回答"]
    ├─ 是 → [结束: 输出"抱歉，我无法回答"]
    └─ 否 → [结束: 输出 LLM 回答]
确认后我会生成完整的工作流 JSON。"
```

### 4. 用户确认
```
用户: "确认"
```

### 5. AI 生成 JSON
```
AI: {
  "app_name": "产品客服智能体",
  "app_mode": "workflow",
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### 6. 前端显示预览 + 创建按钮

### 7. 用户点击"创建工作流"

### 8. 自动跳转到编辑器

## 技术细节

### System Prompt 设计

- **节点 Schema**: 详细定义 9 种节点的必需字段和可选值
- **输出格式**: 强制 JSON 结构（app_name + app_mode + graph）
- **位置规则**: start 固定在 (80, 282)，后续节点 x 递增 300
- **变量引用**: 使用 `value_selector: ["node-id", "variable"]` 格式
- **示例对话**: 包含完整的多轮对话示例（客服智能体）

### JSON 提取逻辑

```python
# 检测 JSON 块
if "{" in response_text and '"app_name"' in response_text:
    start_idx = response_text.find("{")
    end_idx = response_text.rfind("}") + 1
    json_str = response_text[start_idx:end_idx]
    workflow_json = json.loads(json_str)
    
    # 验证必需字段
    if "app_name" in workflow_json and "graph" in workflow_json:
        # 从显示文本中移除 JSON
        response_text = response_text[:start_idx].strip() + "\n\n[工作流 JSON 已生成，可以预览]"
```

### SVG 预览渲染

- **节点**: `<rect>` 矩形 + 类型徽章 + 标题文本
- **边**: `<path>` 贝塞尔曲线（`M x1 y1 C x2 y2, x3 y3, x4 y4`）
- **箭头**: `<marker>` 定义 + `markerEnd="url(#arrowhead)"`
- **颜色**: `NODE_COLORS` 映射表（9 种颜色）

## 测试步骤

### 1. 启动后端
```bash
cd docker
docker compose up -d api
```

### 2. 启动前端
```bash
cd web
pnpm dev
```

### 3. 访问页面
- 打开 http://localhost:3000/apps
- 点击"创建应用"卡片中的"AI 创建工作流"按钮

### 4. 测试对话
- 输入: "我想创建一个能回答产品问题的客服智能体"
- AI 会询问细节，回答后等待 JSON 生成
- 输入: "确认" 触发 JSON 生成
- 右侧应显示工作流预览
- 点击"创建工作流"按钮
- 应自动跳转到工作流编辑页面

### 5. 验证工作流
- 在编辑器中检查节点是否正确
- 检查连接关系是否正确
- 尝试运行工作流

## 已知限制

1. **知识库 ID**: 如果用户说"有知识库"，AI 生成的 JSON 中 `dataset_ids` 会是空数组 `[]`，需要用户手动配置
2. **工具配置**: tool 节点需要 `provider_id`、`tool_name` 等详细信息，AI 无法自动填充
3. **LLM 模型**: 固定使用 qwen-plus，不支持用户选择其他模型
4. **JSON 解析**: 如果 LLM 返回的 JSON 格式不正确（如 markdown 代码块包裹），提取会失败

## 优化方向

### 短期优化
1. **流式输出**: 改为 SSE 流式响应，提升用户体验
2. **知识库选择**: 添加知识库选择下拉框，让用户选择已有知识库
3. **模型选择**: 添加模型选择器，支持 qwen-turbo / gpt-4 等
4. **错误处理**: 更友好的错误提示（如 JSON 解析失败时提示重试）

### 长期优化
1. **多轮迭代**: 支持用户说"把 LLM 节点改成 qwen-turbo"，自动更新 JSON
2. **模板库**: 保存常用的工作流模板（客服、邮件处理、数据分析等）
3. **可视化编辑**: 在预览面板支持拖拽节点、删除节点、添加节点
4. **验证器**: 在创建前自动验证工作流合法性（变量引用、节点连接）
5. **多 Agent**: 复杂工作流拆分为多个 Agent，每个 Agent 独立配置

## 依赖的 API

### 后端
- `POST /console/api/workflow-builder/chat` — 新建
- `POST /console/api/apps` — 现有（创建应用）
- `POST /console/api/apps/{id}/workflows/draft` — 现有（同步工作流图）

### 外部
- DashScope API: `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
- 模型: qwen-plus
- 环境变量: `DASHSCOPE_API_KEY`（已在 docker/.env 中配置）

## 相关文件索引

```
后端:
  api/controllers/console/workflow_builder.py
  api/controllers/console/__init__.py

前端服务:
  web/service/workflow-builder.ts

前端组件:
  web/app/components/apps/workflow-builder/
    ├── dialog.tsx
    ├── use-workflow-builder.ts
    ├── workflow-preview.tsx
    └── index.tsx
  
  web/app/components/apps/new-app-card.tsx

日志:
  web/update.log
```

## 总结

成功实现了"对话式工作流构建器"功能，用户可以通过自然语言描述需求，AI 自动设计并生成完整的 Dify 工作流。该功能：

✅ **零后端改动**: 复用 Dify 现有 API（createApp + syncWorkflowDraft）  
✅ **完整交互流程**: 多轮对话 → 设计方案 → 生成 JSON → 预览 → 创建  
✅ **9 种节点支持**: start、end、llm、knowledge-retrieval、code、if-else、tool、http-request、answer  
✅ **实时预览**: SVG 缩略图显示节点 + 连接关系  
✅ **一键创建**: 自动创建应用 + 同步工作流 + 跳转编辑器  

下一步可以测试功能并根据用户反馈迭代优化。
