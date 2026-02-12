# 服务器列表管理系统

## 项目概述

这是一个基于 Vue 3 和 Express.js 的服务器列表管理系统，支持服务器的增删改查操作。

## 技术栈

### 后端
- Express.js 5.2.1
- Node.js (ES Modules)
- JSON 文件存储

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
├── data/
│   └── server-list.json      # 服务器数据存储
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── server.js     # API 调用封装
│   │   ├── stores/
│   │   │   └── serverStore.js # Pinia 状态管理
│   │   ├── router/
│   │   │   └── index.js      # 路由配置
│   │   ├── components/
│   │   │   ├── ServerCard.vue     # 服务器卡片组件
│   │   │   ├── ServerForm.vue     # 表单组件
│   │   │   └── ContextMenu.vue    # 右键菜单组件
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

### 1. 启动后端服务器

```bash
# 在项目根目录
yarn backend

# 或者
node src/index.js
```

后端服务器将运行在 **http://localhost:8080**

### 2. 启动前端开发服务器

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
- **注意：** ID 字段不在列表中显示

### 2. 添加服务器
1. 点击页面右上角的 **"添加服务器"** 按钮
2. 填写所有必填字段：
   - ID（唯一标识符，只能包含字母、数字、下划线和连字符）
   - 名称
   - 类型
   - 版本
   - 图标 URL（必须是有效的 http/https URL）
   - 链接（必须是有效的 http/https URL）
   - IP 地址
   - 描述
3. 点击 **"提交"** 按钮保存

### 3. 编辑服务器
1. 点击任意服务器卡片
2. 进入编辑页面
3. **ID 字段显示但不可编辑**
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
    "id": "example",
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

### POST /api/edit
创建或更新服务器（需要认证）

**请求头：**
```
Authorization: your_token
```

**请求体：**
```json
[
  {
    "id": "example",
    "name": "示例",
    ...
  }
]
```

**注意：** 必须传递数组格式，Content-Type 必须为 application/json

### POST /api/delete
删除服务器（需要认证）

**请求头：**
```
Authorization: your_token
```

**请求体：**
```json
{
  "id": "example"
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

- **所有字段必填**
- **ID**：只能包含字母、数字、下划线和连字符（`^[a-zA-Z0-9_-]+$`）
- **图标 URL**：必须是有效的 URL（以 http:// 或 https:// 开头）
- **链接**：必须是有效的 URL（以 http:// 或 https:// 开头）

## 数据存储

服务器数据存储在 `data/server-list.json` 文件中。每次修改都会直接写入此文件。

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

从 GHCR 拉取并运行预构建镜像：

```bash
docker pull ghcr.io/minejpgcraft/server-list:latest

docker run -d \
  -p 8080:8080 \
  -e TOKEN=your_admin_token \
  -v $(pwd)/data:/app/data \
  --name mcjpg-server-list \
  ghcr.io/minejpgcraft/server-list:latest
```

### 方式二：本地构建 Docker 镜像

```bash
# 构建镜像
docker build -t mcjpg-server-list .

# 运行容器
docker run -d \
  -p 8080:8080 \
  -e TOKEN=your_admin_token \
  -v $(pwd)/data:/app/data \
  --name mcjpg-server-list \
  mcjpg-server-list
```

### Docker 环境变量

- **PORT**：服务器监听端口（默认：8080）
- **TOKEN**：管理操作的认证令牌（默认：token）

示例：

```bash
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  -e TOKEN=my_secure_token_123 \
  -v $(pwd)/data:/app/data \
  --name mcjpg-server-list \
  mcjpg-server-list
```

### 数据持久化

务必使用 `-v` 参数挂载 `data` 目录，以确保服务器列表数据持久化：

```bash
-v $(pwd)/data:/app/data
```

### 访问应用

容器启动后，访问 **http://localhost:8080**（或你指定的端口）

### Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  server-list:
    image: ghcr.io/minejpgcraft/server-list:latest
    # 或使用本地构建：
    # build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - TOKEN=your_admin_token
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

启动：

```bash
docker-compose up -d
```

## 注意事项

1. 后端运行在 **8080** 端口（可通过环境变量 `PORT` 修改）
2. 前端开发服务器默认运行在 **5173** 端口
3. 前端通过 Vite 代理访问后端 API（`/api/*` 代理到 `http://localhost:8080`）
4. 确保后端服务器先启动，再启动前端开发服务器
5. ID 字段在编辑模式下显示但禁用，确保不会被意外修改
6. **管理操作（添加/编辑/删除）需要认证**：
   - 通过环境变量 `TOKEN` 设置管理令牌（默认值：`token`）
   - 前端需要在请求头中提供 `Authorization` 字段
7. **Docker 部署时务必挂载 `data` 目录**，否则容器重启后数据会丢失

## 故障排除

### 后端无法启动
- 检查 8080 端口是否被占用
- 使用环境变量指定其他端口：`PORT=8081 node src/index.js`

### 前端无法连接后端
- 确认后端服务器正在运行
- 检查 `frontend/vite.config.js` 中的代理配置是否正确
- 检查浏览器控制台的网络请求错误

### 数据未保存
- 检查 `data/server-list.json` 文件权限
- 查看后端控制台的错误日志

## 许可证

MIT
