# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a **secondary development (二次开发)** fork of [Dify](https://github.com/langgenius/dify) v1.9.0, rebranded as **AgentFlow** for 中国广电 - 中广数智科技（北京）有限责任公司. The project name in package.json is `agentflow-web`. All "Dify" branding visible to end users has been replaced with "AgentFlow". Backend protocol-level identifiers (e.g. `X-Dify-Version`, `dify_model_identity`, `langgenius/*` provider IDs) are intentionally preserved for plugin system compatibility.

**Key reference files:**
- `web/update.log` — 二次开发更新日志（所有改动必须记录）
- `web/RESEARCH.md` — 系统调研笔记（用户体系、配置架构、插件系统、探索应用等）

### Deployment Environment

- **Edition**: `SELF_HOSTED` (Cloud-only features like billing/subscription are inactive)
- **Backend API**: `http://localhost:5001/console/api` (console) and `/api` (public/web app)
- **Marketplace**: Still points to `https://marketplace.dify.ai` — may be unreachable in air-gapped networks
- **Custom homepage**: Added a homepage with AI assistant chat; requires `NEXT_PUBLIC_HOME_CHAT_APP_ID` in `web/.env.local` to be set to a published app's ID

## Update Log Rule (Mandatory)

**Every secondary development action must be recorded in `web/update.log`.**

When making any code change (UI modifications, feature additions, bug fixes, configuration changes, branding updates, etc.), append an entry to `web/update.log` with:

- Date header: `## YYYY-MM-DD — Brief description of the change`
- Priority sections: `### P0 — 用户直接可见` for user-facing changes, `### P1 — 外部链接与接口` for external integrations, `### P2 — 内部标识符` for internal refactors
- Each changed file listed with its relative path and a brief description of what was changed
- Bug fixes listed under `### Bug Fix` if applicable

Follow the existing format in update.log for consistency.

**⚠️ 强制执行：每次修改代码后，必须在同一轮对话中立即更新 `web/update.log`，不要等用户提醒。**

## Development Commands

### Frontend (web/)

```bash
cd web
pnpm dev              # Start dev server (with --inspect)
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm eslint-fix       # Fix ESLint issues
pnpm test             # Run all Jest tests
pnpm test -- --testPathPattern=filename   # Run single test file
pnpm test -- -t "test name pattern"       # Run single test by name
```

Node.js >= v22.11.0 required. Package manager: pnpm@10.16.0.

### Backend (api/)

All Python commands use uv:

```bash
uv run --project api pytest                              # All tests
uv run --project api pytest tests/unit_tests/            # Unit tests only
uv run --project api pytest tests/integration_tests/     # Integration tests
uv run --project api pytest tests/unit_tests/test_xxx.py # Single test file
uv run --project api pytest tests/unit_tests/test_xxx.py::test_function_name  # Single test
uv run --project api ruff check --fix ./                 # Fix linting
uv run --project api ruff format ./                      # Format code
uv run --directory api basedpyright                      # Type checking
./dev/start-api                                          # Start API server
./dev/start-worker                                       # Start Celery worker
./dev/reformat                                           # Run all formatters
```

Python >= 3.11, < 3.13. Framework: Flask with SQLAlchemy + Celery.

## Architecture Overview

### Backend (api/)

- **Framework**: Flask + Flask-RESTX, SQLAlchemy ORM, Celery async tasks with Redis broker
- **Controllers** (`api/controllers/`): Split into `console/` (admin UI), `web/` (end-user webapp), `service_api/` (external API), `inner_api/` (internal), `mcp/` (MCP protocol)
- **Core** (`api/core/`): App execution pipeline (`app/`), model runtime (`model_runtime/`), agent system (`agent/`), RAG/indexing, MCP server
- **Models** (`api/models/`): `account.py` (Account, Tenant, TenantAccountJoin), `model.py` (App, EndUser, Message), `provider.py` (Provider, quotas), `dataset.py` (knowledge bases), `workflow.py`
- **Services** (`api/services/`): Business logic layer between controllers and models
- **Database**: PostgreSQL with Alembic migrations (`api/migrations/`)

### User Model

Two distinct user types:
- **Account** (console users): Workspace members with roles (owner/admin/editor/normal/dataset_operator). Many-to-many with Tenant via TenantAccountJoin.
- **EndUser** (app consumers): People using AI apps via web interface or Service API. No role system. Tracked per-app per-tenant.

### Frontend (web/)

- **Framework**: Next.js 15 with App Router, React 19, TypeScript, Tailwind CSS
- **State**: SWR for server state, Zustand for client state, React Context for shared state
- **API layer**: `web/service/` — typed fetcher functions used with SWR/useSWRInfinite
- **i18n**: `web/i18n/` — 21 language directories, `en-US/` is the source language. Use `useTranslation()` hook.
- **Components**: `web/app/components/` — organized by feature (apps, billing, datasets, header, workflow, etc.)

### Key Patterns

- **RBAC decorators** on console endpoints: `@only_edition_cloud`, `@account_initialization_required`, role checks via `current_user.is_admin_or_owner`
- **Cloud vs Self-hosted**: Many features gated by `EDITION` env var (`CLOUD` vs `SELF_HOSTED`). Billing features only active in Cloud edition.
- **i18n**: All user-facing text must use i18n keys from `web/i18n/en-US/`. Source language is English. Chinese (zh-Hans) is the primary target language for this fork.
- **Branding**: All user-visible "Dify" references have been replaced with "AgentFlow". Do not reintroduce "Dify" in user-facing strings. Backend protocol identifiers are intentionally kept as-is.

## Intentionally Preserved Dify References

These must NOT be renamed (backend protocol compatibility):
- `X-Dify-Version` HTTP header (plugin marketplace API)
- `minimum_dify_version` field in plugin type definitions
- `dify_model_identity === '__dify__file__'` (file protocol)
- `langgenius/*` model provider IDs (plugin system)
- `saas-dify-blue-*` CSS tokens (internal variables)
- `DifyLogo` component name (code-level reference)

## Secondary Development Caveats

Known issues from the rebranding that need attention when deploying:

1. **Embedded chatbot domain detection**: `web/app/components/base/chat/embedded-chatbot/utils.ts` has `isAgentFlow()` which checks `document.referrer.includes('agentflow.ai')`. If deployed on a different domain, the embedded chatbot won't show AgentFlow branding. Update the domain string to match actual deployment domain.

2. **Marketplace URLs**: `web/.env.local` still has `marketplace.dify.ai` for `NEXT_PUBLIC_MARKETPLACE_API_PREFIX` and `NEXT_PUBLIC_MARKETPLACE_URL_PREFIX`. In air-gapped networks, replace with internal marketplace or accept that plugin browsing won't work.

3. **Homepage AI assistant**: `NEXT_PUBLIC_HOME_CHAT_APP_ID` in `web/.env.local` must be set to a published app's ID for the custom homepage chat to function.

4. **Documentation links**: All `docs.dify.ai` links were replaced with `#`. If an internal documentation site exists, update these to the real URL.

5. **i18n safety**: The bulk Dify→AgentFlow replacement in i18n files had issues with curly quotes and escaped apostrophes (fixed per update.log). When adding new i18n keys, use straight quotes only (`'` not `'`/`'`, `"` not `"`/`"`).
