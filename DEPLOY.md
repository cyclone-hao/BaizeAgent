# 白泽智能体平台 — 生产环境部署指南

## 架构概览

```
你的代码 (GitHub: cyclone-hao/BaizeAgent)
    │
    ├── push 到 main 分支
    │       ↓
    │   GitHub Actions 自动构建
    │       ↓
    │   推送到 ghcr.io/cyclone-hao/baize-api:latest
    │          ghcr.io/cyclone-hao/baize-web:latest
    │
    └── 服务器 docker compose pull & up
            ↓
        使用自定义镜像启动全部服务
```

**镜像来源对比：**

| 服务 | 开发环境 | 生产环境 |
|------|---------|---------|
| API | `langgenius/dify-api:1.9.0` + volume 挂载代码 | `ghcr.io/cyclone-hao/baize-api:latest` (代码内置) |
| Web | `langgenius/dify-web:1.9.0` | `ghcr.io/cyclone-hao/baize-web:latest` (代码内置) |
| Worker | 同 API | 同 API |
| DB | `postgres:15-alpine` | 不变 |
| Redis | `redis:6-alpine` | 不变 |
| Sandbox | `langgenius/dify-sandbox:0.2.12` | 不变 |
| Plugin Daemon | `langgenius/dify-plugin-daemon:0.3.0-local` | 不变 |
| Weaviate | `semitechnologies/weaviate:1.19.0` | 不变 |

---

## 第一步：构建自定义镜像（在你的开发电脑上）

### 方式 A：GitHub Actions 自动构建（推荐）

1. 确保代码已推送到 GitHub：
```bash
cd D:\MyNewStart\CC实战\agentflow
git add .
git commit -m "release: v1.0"
git push origin agentflow-ui-customization
```

2. GitHub Actions 会自动触发构建，推送到 GHCR（GitHub Container Registry）
   - 镜像地址：`ghcr.io/cyclone-hao/baize-api:latest`
   - 镜像地址：`ghcr.io/cyclone-hao/baize-web:latest`

3. 在 GitHub 仓库 Settings → Packages 中，将 `baize-api` 和 `baize-web` 的可见性改为 **Public**（或配置 PAT token）

### 方式 B：本地手动构建

```bash
cd D:\MyNewStart\CC实战\agentflow

# 构建 API 镜像
docker build -t ghcr.io/cyclone-hao/baize-api:latest -f api/Dockerfile api/

# 构建 Web 镜像
docker build -t ghcr.io/cyclone-hao/baize-web:latest -f web/Dockerfile web/

# 推送到 GHCR
docker login ghcr.io -u cyclone-hao
docker push ghcr.io/cyclone-hao/baize-api:latest
docker push ghcr.io/cyclone-hao/baize-web:latest
```

---

## 第二步：服务器部署

### 2.1 服务器环境要求

- Docker >= 24.0
- Docker Compose >= 2.20
- 至少 4GB RAM、20GB 磁盘

### 2.2 克隆 docker 目录到服务器

```bash
# 在服务器上
mkdir -p /opt/baize
cd /opt/baize

# 只克隆 docker 目录（不需要整个仓库）
git clone --depth 1 https://github.com/cyclone-hao/BaizeAgent.git
cp -r BaizeAgent/docker/* .
rm -rf BaizeAgent
```

### 2.3 配置环境变量

```bash
cp .env.example .env
vim .env
```

**必须修改的配置项：**

```bash
# 安全密钥（必须修改！）
SECRET_KEY=<用 openssl rand -base64 42 生成>
INIT_PASSWORD=<管理员初始密码>

# 数据库密码
DB_PASSWORD=<强密码>
REDIS_PASSWORD=<强密码>

# 你的 API 地址（服务器公网 IP 或域名）
CONSOLE_API_URL=http://你的域名:80/api
APP_API_URL=http://你的域名:80/api
CONSOLE_WEB_URL=http://你的域名
APP_WEB_URL=http://你的域名

# 二次开发新增的 API Key
WEB_SEARCH_API_KEY=<你的 Tavily API Key>
DASHSCOPE_API_KEY=<你的 DashScope API Key>
```

### 2.4 修改 docker-compose.yaml 使用自定义镜像

在服务器的 `docker-compose.yaml` 中，替换以下 3 处镜像名：

```yaml
# 1. api 服务 — 替换镜像 + 移除代码挂载 volume
api:
  image: ghcr.io/cyclone-hao/baize-api:latest   # ← 改这里
  volumes:
    - ./volumes/app/storage:/app/api/storage
    # ← 删除所有 ../api/xxx 的代码挂载

# 2. worker 服务 — 同上
worker:
  image: ghcr.io/cyclone-hao/baize-api:latest   # ← 改这里
  volumes:
    - ./volumes/app/storage:/app/api/storage
    # ← 删除所有 ../api/xxx 的代码挂载

# 3. web 服务 — 替换镜像
web:
  image: ghcr.io/cyclone-hao/baize-web:latest   # ← 改这里
```

> **注意**：生产环境不需要挂载代码目录，因为所有二次开发代码已经打包进镜像。

### 2.5 登录 GHCR 并启动

```bash
# 登录 GitHub Container Registry
# 方式 1：用 GitHub PAT (Personal Access Token, 需要 read:packages 权限)
echo YOUR_PAT | docker login ghcr.io -u cyclone-hao --password-stdin

# 方式 2：如果镜像已设为 Public，无需登录

# 拉取镜像
docker compose pull api worker web

# 启动所有服务
docker compose up -d
```

### 2.6 验证

```bash
# 检查所有容器状态
docker compose ps

# 检查 API 日志
docker compose logs api --tail=20

# 验证 API 响应
curl http://localhost:80/console/api/setup
```

---

## 第三步：后续更新流程

每次代码修改后：

```bash
# 1. 在开发电脑上推送代码
git add . && git commit -m "feat: xxx" && git push

# 2. 等待 GitHub Actions 构建完成（约 5-10 分钟）

# 3. 在服务器上更新
cd /opt/baize
docker compose pull api worker web
docker compose up -d api worker web
```

---

## 常见问题

### Q: 服务器无法访问 ghcr.io？
**方案 1**：使用镜像加速器
```bash
# 在 /etc/docker/daemon.json 中添加
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}
```

**方案 2**：本地构建后导出到服务器
```bash
# 开发电脑
docker save ghcr.io/cyclone-hao/baize-api:latest | gzip > baize-api.tar.gz
docker save ghcr.io/cyclone-hao/baize-web:latest | gzip > baize-web.tar.gz
scp baize-*.tar.gz user@server:/opt/baize/

# 服务器
docker load < baize-api.tar.gz
docker load < baize-web.tar.gz
docker compose up -d
```

### Q: 如何回滚到上一个版本？
```bash
# 查看可用版本
docker compose logs api | grep COMMIT_SHA

# 使用特定 SHA 版本
# 修改 docker-compose.yaml 中的 image tag 为具体 SHA
docker compose pull && docker compose up -d
```

### Q: 数据库数据如何迁移？
`./volumes/db/data` 目录包含所有 PostgreSQL 数据，直接复制到新服务器即可。
