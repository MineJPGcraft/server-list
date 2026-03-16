# 服务器列表管理系统

## 项目概述

这是一个基于 Vue 3 和 Express.js 的服务器列表管理系统，支持服务器的增删改查、OIDC 单点登录、用户权限管理与审核工作流。

## 技术栈

### 后端
- Express.js 5.2.1
- Node.js (ES Modules)
- PostgreSQL（数据库）

### 前端
- Vue 3
- Vite（构建工具）
- Pinia（状态管理）
- Vue Router（路由）
- Naive UI（UI 组件库）
- Axios（HTTP 客户端）

## 项目结构

```
server-list/
├── src/
│   ├── index.js          # 入口，路由挂载
│   ├── admin.js          # 服务器、用户、申请管理接口
│   ├── auth.js           # 认证接口（Token / OIDC 回调）
│   ├── db.js             # 数据库初始化
│   ├── oidc-config.js    # OIDC 配置接口
│   └── request.js        # 用户申请 CRUD 接口
├── frontend/
│   └── src/
│       ├── api/
│       │   └── server.js          # API 调用封装
│       ├── stores/
│       │   ├── serverStore.js     # 服务器数据状态
│       │   └── authStore.js       # 认证状态（含权限）
│       ├── router/
│       │   └── index.js           # 路由配置
│       ├── components/
│       │   ├── ServerCard.vue     # 服务器卡片
│       │   ├── ServerForm.vue     # 服务器表单
│       │   ├── ContextMenu.vue    # 右键菜单
│       │   └── TokenDialog.vue    # 登录对话框
│       └── views/
│           ├── ServerList.vue     # 服务器列表页
│           ├── ServerEdit.vue     # 服务器编辑/新增页
│           ├── OidcAdmin.vue      # OIDC 配置管理页
│           ├── UserAdmin.vue      # 用户权限管理页
│           ├── RequestList.vue    # 用户申请列表页
│           ├── RequestForm.vue    # 申请创建/编辑页
│           └── RequestAdmin.vue   # 申请审核页（管理员）
└── package.json
```

## 启动项目

### 1. 准备数据库

确保已安装并启动 PostgreSQL，然后创建数据库：

```bash
psql -U postgres
CREATE DATABASE serverlist;
```

数据库表结构会在首次启动时自动创建。

### 2. 启动后端

```bash
# 项目根目录
yarn backend

# 或手动指定环境变量
DB_PASSWORD=your_password TOKEN=your_token node src/index.js
```

后端运行在 **http://localhost:8080**

### 3. 启动前端（开发）

```bash
cd frontend
yarn dev
```

前端运行在 **http://localhost:5173**

## 认证与权限

系统支持两种登录方式，会话权限取两者最大值。

### 权限等级

| 权限等级 | 角色 | 可访问功能 |
|----------|------|-----------|
| 1 | 普通用户 | 提交服务器操作申请（需管理员审核） |
| 2 | 管理员 | 直接增删改服务器、审核用户申请 |
| 3 | 超级管理员 | perm=2 全部功能 + 用户管理、封禁用户、OIDC 配置 |

> Token 登录默认授予 perm=3。OIDC 提供商可设置权限覆写，实际权限取配置值与用户数据库权限的最大值。

### Token 登录

点击页面右上角 **"登录"** 按钮，输入后端 `TOKEN` 环境变量对应的令牌。

- Token 未配置时提示"Token 登录未启用"
- Token 错误时提示"Token 无效"

### OIDC 登录

在 OIDC 配置管理页（需 perm=3）添加提供商后，登录对话框会显示对应的 OIDC 登录按钮。

**以 Casdoor 为例：**

| 字段 | 值 |
|------|----|
| `auth_url` | `http://<casdoor_host>/login/oauth/authorize` |
| `apipoint` | `http://<casdoor_host>/api/login/oauth/access_token` |
| `redirect_uri` | `http://<your_host>/api/auth/callback` |

## 功能说明

### 服务器列表
- 显示所有服务器的图标、名称、简介
- 支持按名称搜索、分页
- 右键服务器卡片可删除（perm≥2）或申请编辑（perm=1）
- 单击卡片进入编辑页

### 服务器管理（perm ≥ 2）
- 点击"添加服务器"新增（UUID 自动生成）
- 编辑页可修改除 UUID 外的所有字段
- IP 字段为可选项
- 编辑页可一键"创建草稿"将当前数据保存为编辑申请

### 申请审核工作流

**普通用户（perm=1）：**
1. 点击"添加服务器"跳转至申请表单，或右键服务器选择"申请编辑"
2. 填写信息后保存草稿或直接提交审核
3. 在"我的申请"页查看申请状态，可撤回/修改/删除草稿
4. 待审核申请上限由 `MAX_PENDING_PER_USER` 环境变量控制（默认 3）

**管理员（perm≥2）审核：**
1. 进入"申请管理"页查看所有待审核申请
2. 可通过、拒绝（填写理由）或编辑申请内容
3. 审核编辑类申请时若目标服务器已删除，可选择转为新建工单

### 用户管理（perm ≥ 3）
- 查看所有已登录过的用户
- 修改用户的权限等级（1/2/3）
- 封禁/解封用户（封禁后立即使其所有会话失效）

### OIDC 配置管理（perm ≥ 3）
- 增删改 OIDC 提供商配置
- 配置项包括：Client ID、Secret、授权端点、令牌端点、回调地址、权限覆写等

## API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/getjson` | 获取服务器列表 |
| GET | `/api/oidcConfig/list` | 获取 OIDC 提供商列表（仅公开字段） |
| GET | `/api/auth/check` | 检查登录状态，返回 `{ perm }` |
| POST | `/api/auth/token` | Token 登录 |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/callback` | OIDC 回调 |

### 用户接口（perm ≥ 1）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/request/list` | 获取当前用户所有申请 |
| POST | `/api/request/create` | 创建草稿 |
| POST | `/api/request/edit` | 修改草稿（或将已拒绝申请重置为草稿） |
| POST | `/api/request/submit` | 提交草稿为待审核 |
| POST | `/api/request/cancel` | 撤回待审核申请为草稿 |
| POST | `/api/request/delete` | 删除草稿 |

### 管理接口（perm ≥ 2）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/create` | 新增服务器 |
| POST | `/api/admin/edit` | 修改服务器 |
| POST | `/api/admin/delete` | 删除服务器 |
| GET | `/api/admin/request/list` | 获取所有待审核申请 |
| POST | `/api/admin/request/edit` | 编辑申请数据 |
| POST | `/api/admin/request/approve` | 审核通过（可选 `force_create` 强制新建） |
| POST | `/api/admin/request/reject` | 拒绝申请（可附理由） |
| POST | `/api/admin/request/submit` | 将草稿提交为待审核（绕过用户数量限制） |

### 超级管理员接口（perm ≥ 3）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/user/list` | 获取用户列表 |
| POST | `/api/admin/user/edit` | 修改用户权限 |
| POST | `/api/admin/user/ban` | 封禁/解封用户（封禁时删除其所有会话） |
| GET | `/api/oidcConfig/admin/list` | 获取 OIDC 完整配置列表 |
| POST | `/api/oidcConfig/admin/create` | 新增 OIDC 提供商 |
| POST | `/api/oidcConfig/admin/edit` | 修改 OIDC 提供商 |
| POST | `/api/oidcConfig/admin/delete` | 删除 OIDC 提供商 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8080` | 后端监听端口 |
| `TOKEN` | 无 | 管理令牌，不设置则禁用 Token 登录（登录后获得 perm=3） |
| `MAX_PENDING_PER_USER` | `3` | 每用户最大待审核申请数 |
| `DB_USER` | `postgres` | 数据库用户名 |
| `DB_PASSWORD` | `password` | 数据库密码 |
| `DB_HOST` | `localhost` | 数据库主机 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_NAME` | `serverlist` | 数据库名称 |

## Docker 部署

### Docker Compose（推荐）

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:latest
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: serverlist
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  server-list:
    image: ghcr.io/minejpgcraft/server-list:latest
    ports:
      - "8080:8080"
    environment:
      - TOKEN=your_admin_token
      - DB_HOST=postgres
      - DB_PASSWORD=password
      - DB_NAME=serverlist
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

### 手动 Docker

```bash
docker run -d \
  -p 8080:8080 \
  -e TOKEN=your_admin_token \
  -e DB_HOST=postgres-db \
  -e DB_PASSWORD=password \
  -e DB_NAME=serverlist \
  --link postgres-db:postgres-db \
  ghcr.io/minejpgcraft/server-list:latest
```

## 许可证

MIT
