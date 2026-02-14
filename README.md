# 服务器列表管理系统

## 项目概述

这是一个基于 Vue 3 和 Express.js 的服务器列表管理系统，支持服务器的增删改查操作。

## 技术栈

### 后端
- Express.js 5.2.1
- Node.js (ES Modules)
- PostgreSQL (数据库)

### 前端
- Vue 3
- Vite (构建工具)
- Pinia (状态管理)
- Vue Router (路由)
- Naive UI (UI 组件库)
- Axios (HTTP 客户端)

## 项目结构

```
server-list/
├── src/
│   └── index.js              # Express 后端服务器
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── server.js     # API 调用封装
│   │   ├── stores/
│   │   │   ├── serverStore.js # Pinia 状态管理
│   │   │   └── authStore.js   # 认证状态管理
│   │   ├── router/
│   │   │   └── index.js      # 路由配置
│   │   ├── components/
│   │   │   ├── ServerCard.vue     # 服务器卡片组件
│   │   │   ├── ServerForm.vue     # 表单组件
│   │   │   ├── ContextMenu.vue    # 右键菜单组件
│   │   │   └── TokenDialog.vue    # 令牌输入对话框
│   │   ├── composables/
│   │   │   └── useContextMenu.js  # 右键菜单逻辑
│   │   ├── views/
│   │   │   ├── ServerList.vue     # 列表页面
│   │   │   └── ServerEdit.vue     # 编辑/新增页面
│   │   ├── App.vue
│   │   └── main.js
│   ├── vite.config.js        # Vite 配置
│   └── package.json
└── package.json
```

## 启动项目

### 1. 准备数据库

确保已安装并启动 PostgreSQL 数据库，然后创建数据库：

```bash
# 连接 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE serverlist;
```

**配置数据库连接**（通过环境变量）：
- `DB_USER`：数据库用户名（默认：postgres）
- `DB_PASSWORD`：数据库密码（默认：password）
- `DB_HOST`：数据库主机（默认：localhost）
- `DB_PORT`：数据库端口（默认：5432）
- `DB_NAME`：数据库名称（默认：serverlist）

### 2. 启动后端服务器

```bash
# 在项目根目录
yarn backend

# 或者使用环境变量
DB_PASSWORD=your_password PORT=8080 TOKEN=your_token node src/index.js
```

后端服务器将运行在 **http://localhost:8080**

数据库表会在首次启动时自动创建。

### 3. 启动前端开发服务器

```bash
# 进入 frontend 目录
cd frontend

# 启动开发服务器
yarn dev
```

前端开发服务器将运行在 **http://localhost:5173** （或其他可用端口）

### 3. 访问应用

在浏览器中打开前端开发服务器提供的 URL（通常是 http://localhost:5173 或 http://localhost:5174）

## 功能说明

### 0. 认证设置

首次使用或执行管理操作前，需要设置认证令牌：

1. 打开浏览器的开发者工具（F12）
2. 进入 Console（控制台）标签
3. 输入以下命令设置令牌：
   ```javascript
   localStorage.setItem('auth_token', 'your_token_here')
   ```
4. 将 `your_token_here` 替换为你在后端设置的 TOKEN 环境变量值（默认为 `token`）
5. 刷新页面

**示例：**
```javascript
// 如果后端 TOKEN 环境变量为 "my_secure_token_123"
localStorage.setItem('auth_token', 'my_secure_token_123')
```

特别的，如果你没有设置令牌，在第一次执行管理操作时前端会自动要求输入并自动设置令牌

### 1. 查看服务器列表
- 打开应用后默认显示所有服务器
- 每个服务器卡片显示：图标、名称、描述
- **注意：** UUID 字段不在列表中显示

### 2. 添加服务器
1. 点击页面右上角的 **"添加服务器"** 按钮
2. 填写所有必填字段：
   - 名称
   - 类型
   - 版本
   - 图标 URL（必须是有效的 http/https URL）
   - 链接（必须是有效的 http/https URL）
   - IP 地址（可选）
   - 描述
3. 点击 **"提交"** 按钮保存
4. **UUID 将由后端自动生成**

### 3. 编辑服务器
1. 点击任意服务器卡片
2. 进入编辑页面
3. **UUID 字段显示但不可编辑**
4. 修改其他字段
5. 点击 **"提交"** 保存更改

### 4. 删除服务器
1. 在服务器卡片上 **右键点击**
2. 在弹出的菜单中选择 **"删除"**
3. 在确认对话框中点击 **"确认"**

## API 接口

### GET /api/getjson
获取所有服务器列表（无需认证）

**响应示例：**
```json
[
  {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "id": 0,
    "name": "示例",
    "type": "类型",
    "version": "1.0.0",
    "icon": "https://example.com/icon.png",
    "description": "描述",
    "link": "https://example.com",
    "ip": "example.com"
  }
]
```

**注意：**
- `uuid` 是数据库生成的唯一标识符
- `id` 是前端显示用的序号（从0开始）

### POST /api/create
创建新服务器（需要认证）

**请求头：**
```
Authorization: your_token
```

**请求体：**
```json
{
  "name": "示例",
  "type": "类型",
  "version": "1.0.0",
  "icon": "https://example.com/icon.png",
  "description": "描述",
  "link": "https://example.com",
  "ip": "example.com"
}
```

**注意：**
- 不需要提供 `uuid`，将由数据库自动生成
- `ip` 字段可选，如果不提供则为 null

**响应：**
返回新创建服务器的 UUID

### POST /api/edit
更新现有服务器（需要认证）

**请求头：**
```
Authorization: your_token
```

**请求体：**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "更新的示例",
  "type": "新类型",
  "version": "2.0.0",
  "icon": "https://example.com/new-icon.png",
  "description": "更新的描述",
  "link": "https://example.com/new",
  "ip": "new.example.com"
}
```

**注意：**
- 必须提供 `uuid` 字段来指定要更新的服务器
- `ip` 字段可选

**响应：**
- 200：更新成功
- 404：服务器不存在

### POST /api/delete
删除服务器（需要认证）

**请求头：**
```
Authorization: your_token
```

**请求体：**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /api/checkToken
验证管理令牌（需要认证）

**请求头：**
```
Authorization: your_token
```

**响应：**
- 200：令牌有效
- 401：未提供令牌
- 403：令牌无效

## 表单验证规则

- **必填字段**：名称、类型、版本、图标 URL、链接、描述
- **可选字段**：IP 地址
- **图标 URL**：必须是有效的 URL（以 http:// 或 https:// 开头）
- **链接**：必须是有效的 URL（以 http:// 或 https:// 开头）
- **UUID**：在编辑模式下自动显示，不可修改；创建模式下由后端自动生成

## 数据存储

服务器数据存储在 PostgreSQL 数据库中。数据库表结构如下：

```sql
CREATE TABLE server (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    version text NOT NULL,
    icon text NOT NULL,
    description text NOT NULL,
    link text NOT NULL,
    IP text
);
```

## 开发说明

### 安装依赖

```bash
# 安装后端依赖（项目根目录）
yarn install

# 安装前端依赖
cd frontend
yarn install
```

### 构建生产版本

```bash
cd frontend
yarn build
```

构建产物将生成在 `frontend/dist` 目录。

## Docker 部署

### 方式一：使用 GitHub Container Registry 镜像

从 GHCR 拉取并运行预构建镜像（需要配合 PostgreSQL 数据库）：

```bash
# 先启动 PostgreSQL 数据库
docker run -d \
  --name postgres-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=serverlist \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:latest

# 运行应用容器
docker pull ghcr.io/minejpgcraft/server-list:latest

docker run -d \
  -p 8080:8080 \
  -e TOKEN=your_admin_token \
  -e DB_HOST=postgres-db \
  -e DB_PASSWORD=password \
  -e DB_NAME=serverlist \
  --link postgres-db:postgres-db \
  --name mcjpg-server-list \
  ghcr.io/minejpgcraft/server-list:latest
```

### 方式二：本地构建 Docker 镜像

```bash
# 构建镜像
docker build -t mcjpg-server-list .

# 启动 PostgreSQL 数据库
docker run -d \
  --name postgres-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=serverlist \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:latest

# 运行容器
docker run -d \
  -p 8080:8080 \
  -e TOKEN=your_admin_token \
  -e DB_HOST=postgres-db \
  -e DB_PASSWORD=password \
  -e DB_NAME=serverlist \
  --link postgres-db:postgres-db \
  --name mcjpg-server-list \
  mcjpg-server-list
```

### Docker 环境变量

- **PORT**：服务器监听端口（默认：8080）
- **TOKEN**：管理操作的认证令牌（默认：token）
- **DB_USER**：数据库用户名（默认：postgres）
- **DB_PASSWORD**：数据库密码（默认：password）
- **DB_HOST**：数据库主机（默认：localhost）
- **DB_PORT**：数据库端口（默认：5432）
- **DB_NAME**：数据库名称（默认：serverlist）

示例：

```bash
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  -e TOKEN=my_secure_token_123 \
  -e DB_HOST=my-postgres-host \
  -e DB_PASSWORD=secure_password \
  -e DB_NAME=myserverlist \
  --name mcjpg-server-list \
  mcjpg-server-list
```

### 数据持久化

数据存储在 PostgreSQL 数据库中，务必使用 Docker volume 挂载数据库数据目录：

```bash
-v postgres_data:/var/lib/postgresql/data
```

### 访问应用

容器启动后，访问 **http://localhost:8080**（或你指定的端口）

### Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:latest
    container_name: postgres-db
    environment:
      POSTGRES_USER: postgres
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
    # 或使用本地构建：
    # build: .
    container_name: mcjpg-server-list
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - TOKEN=your_admin_token
      - DB_HOST=postgres
      - DB_USER=postgres
      - DB_PASSWORD=password
      - DB_PORT=5432
      - DB_NAME=serverlist
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

启动：

```bash
docker-compose up -d
```

停止：

```bash
docker-compose down
```

查看日志：

```bash
docker-compose logs -f
```

## 注意事项

1. 后端运行在 **8080** 端口（可通过环境变量 `PORT` 修改）
2. 前端开发服务器默认运行在 **5173** 端口
3. 前端通过 Vite 代理访问后端 API（`/api/*` 代理到 `http://localhost:8080`）
4. 确保 PostgreSQL 数据库先启动，再启动后端服务器
5. UUID 字段在编辑模式下显示但禁用，确保不会被意外修改；创建模式下完全不显示
6. IP 地址字段为可选项，可以留空
7. **管理操作（添加/编辑/删除）需要认证**：
   - 通过环境变量 `TOKEN` 设置管理令牌（默认值：`token`）
   - 前端需要在请求头中提供 `Authorization` 字段
8. **Docker 部署时务必使用 Docker Compose 或正确配置数据库连接**，否则应用无法启动
9. 数据库表会在应用首次启动时自动创建

## 故障排除

### 后端无法启动
- 检查 8080 端口是否被占用
- 使用环境变量指定其他端口：`PORT=8081 node src/index.js`
- 确认 PostgreSQL 数据库已启动并可以连接
- 检查数据库连接参数是否正确

### 前端无法连接后端
- 确认后端服务器正在运行
- 检查 `frontend/vite.config.js` 中的代理配置是否正确
- 检查浏览器控制台的网络请求错误

### 数据库连接失败
- 检查 PostgreSQL 是否正在运行
- 验证数据库连接参数（用户名、密码、主机、端口、数据库名）
- 确认数据库用户具有创建表的权限
- 查看后端控制台的错误日志

### Docker 容器无法连接数据库
- 确保使用 `--link` 参数或 Docker Compose 的 `depends_on` 连接容器
- 检查 `DB_HOST` 环境变量是否指向正确的容器名称
- 使用 `docker logs` 查看应用和数据库容器的日志

## 许可证

MIT
