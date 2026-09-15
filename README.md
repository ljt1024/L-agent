# 织核 · Agent Ops

基于《智能体系统架构设计文档 V1.0》实现的 Web 端智能体工程首版。当前版本聚焦 P0-P3 的控制台体验：主 Agent 会话、工具/Skill 能力、固化任务、Sub-agent、长期记忆、定时调度与可观测性。

## 运行

```bash
npm install
npm run dev
```

默认地址：`http://localhost:5173`

生产构建：

```bash
npm run build
npm run preview
```

启动本地 API（另开一个终端）：

```bash
npm run api
```

或直接启动前后端：

```bash
npm run dev:full
```

企业级依赖配置：

```bash
cp .env.example .env
# 填写 OPENAI_API_KEY 与 DATABASE_URL
psql "$DATABASE_URL" -f db/schema.sql
```

## 当前实现

- 单页控制台，左侧导航覆盖总览、工作台、智能体、固化任务、Skills、记忆、调度和审计日志。
- 工作台支持输入消息、发送、运行状态、ReAct 轨迹、工具调用结果和记忆注入状态展示。
- 总览保留视觉演示数据；智能体、固化任务、记忆、调度和审计页面已改为实时读取 API，并在创建后自动刷新。
- 工作台新建运行已接入本地 API：`POST /api/runs`，API 故障会显示明确错误，不再静默伪造成功。
- 本地 API 提供 `/api/health`、`/api/overview`、`/api/agents`、`/api/tasks`、`/api/memory`、`/api/schedules`、`/api/runs`。
- `/api/runs` 已接入 OpenAI 兼容 Chat Completions；未配置密钥时自动进入本地降级模式。
- `/api/mcp/connect`、`/api/mcp/tools`、`/api/mcp/call` 使用官方 MCP Client SDK 管理 Stdio MCP Server。
- `/api/sandbox/exec` 使用 Docker 容器隔离执行，默认禁用，打开前必须显式设置 `DOCKER_SANDBOX_ENABLED=true`。
- PostgreSQL 通过 `pg` 连接，运行记录和审计事件落盘到 `db/schema.sql` 中的表。
- 视觉基调采用深色操作台、青绿色运行态和橙色风险态，呼应沙箱、安全与可观测架构。

## API 接入边界

后续接入后端时，建议保持页面模块边界不变：

- `workbench`：流式会话 / SSE、工具调用事件、运行追踪。
- `agents`、`tasks`、`skills`：注册表、生命周期和版本管理 API。
- `memory`：用户画像与助手笔记的 add / replace / remove API。
- `schedules`：平台调度服务的 CRUD、试跑和执行结果推送。
- `audit`：Trace ID、工具耗时、审计事件和质量评测指标。

## 当前可用性

- 未配置外部服务时，页面和本地编排 API 仍可运行；健康接口会明确返回 LLM、数据库和沙箱状态。
- 配置 `OPENAI_API_KEY` 后，`/api/runs` 使用真实模型生成回复。
- 配置 `DATABASE_URL` 并执行 schema 后，运行记录和审计事件写入 PostgreSQL；未配置时使用进程内存存储。
- 设置 `DOCKER_SANDBOX_ENABLED=true` 后才允许执行 Docker 沙箱命令，默认拒绝执行。

## 生产化注意事项

- 生产环境应把 API 放在反向代理后，增加 JWT/OIDC 鉴权、租户隔离、限流、请求签名和密钥托管。
- Docker 沙箱应替换为 gVisor/Firecracker，配置网络白名单、只读 Skill 挂载、CPU/内存/进程数上限。
- OpenAI 请求应通过企业网关统一重试、预算、模型路由和内容安全策略。
- MCP Server 需要做签名校验、工具权限声明和调用审计，禁止直接信任用户传入的 command。

## 目录

```text
src/
  main.jsx      # 页面、模块和本地交互状态
  api.js        # 前端 API 客户端与降级策略
  styles.css    # 控制台视觉系统与响应式约束
server/
  index.js      # 本地 Agent API 服务
  config.js     # 环境变量与安全开关
  llm.js        # OpenAI 兼容模型适配器
  mcp.js        # MCP Stdio Client 注册与调用
  sandbox.js    # Docker 沙箱执行器
  db.js         # PostgreSQL / 内存降级存储
db/
  schema.sql    # PostgreSQL 表结构
index.html
```
