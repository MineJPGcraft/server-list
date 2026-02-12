# 阶段1：构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install && npm cache clean --force
COPY frontend/ ./
RUN npm run build

# 阶段2：最终镜像
FROM node:20-alpine
WORKDIR /app

# 安装后端依赖并清理缓存
COPY package*.json ./
RUN npm install --omit=dev && \
    npm cache clean --force && \
    rm -rf /root/.npm /tmp/*

# 复制源码和构建产物
COPY data/ ./data/
COPY src/ ./src/
COPY --from=frontend-builder /app/dist ./dist

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chown -R node:node /app

# 环境变量
ENV NODE_ENV=production PORT=8080

EXPOSE 8080

# 使用非 root 用户
USER node

CMD ["node", "src/index.js"]
