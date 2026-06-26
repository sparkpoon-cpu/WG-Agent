# WG Agent — 团队 AI 编剧助手

基于 DeepSeek API 的网页版剧本创作助手，支持团队协作。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite + Tailwind CSS |
| 后端 | Express + SQLite |
| API | DeepSeek（服务端代理） |
| 部署 | Docker / NAS / 云服务器 |

## 快速开始（本地开发）

```bash
# 安装依赖
cd server && npm install && cd ../client && npm install && cd ..

# 启动后端（端口 3001）
cd server && npx tsx src/index.ts &

# 启动前端（端口 5173，开发模式热更新）
cd client && npx vite --host
```

打开 http://localhost:5173

## Docker 部署（NAS / 服务器）

### 方式一：docker-compose 构建

```bash
git clone https://github.com/你的用户名/wg-agent.git
cd wg-agent
docker compose up -d
```

访问 http://你的IP:3001

### 方式二：拉取预构建镜像（GitHub Actions 自动构建）

```bash
# 下载 docker-compose.prod.yml
wget https://raw.githubusercontent.com/你的用户名/wg-agent/main/docker-compose.prod.yml

# 把文件里的 YOUR_USERNAME 改成你的 GitHub 用户名
# 然后启动
docker compose -f docker-compose.prod.yml up -d
```

> GitHub Actions 会在每次 push 代码后自动构建 Docker 镜像并推送到 ghcr.io

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| ADMIN_PASSWORD | admin | 管理员初始密码 |
| JWT_SECRET | change-me-... | JWT 签名密钥 |
| PORT | 3001 | 服务端口 |
| DB_PATH | /data/wg-agent.db | SQLite 数据库路径 |

## 登录

| 用户名 | 密码 |
|---|---|
| admin | admin |

首次登录后去 **设置** → 配置 DeepSeek API Key → 添加团队成员账号。

## GitHub Actions

Push 到 main 分支后自动构建 Docker 镜像并推送到 `ghcr.io/你的用户名/wg-agent`。
需要确保仓库开启了 **Packages** 权限（Settings → Actions → General → Workflow permissions → Read and write packages）。
